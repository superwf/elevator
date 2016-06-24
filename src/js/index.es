// 在中间楼层停的时候，如果没有当前任务，则向下优先
;(function(){

  // 正向排序
  function ascSort(a, b) {
    if (a === b) {
      return 0
    }
    return a > b ? 1 : -1
  }
  // 反向排序
  function descSort(a, b) {
    if (a === b) {
      return 0
    }
    return a < b ? 1 : -1
  }

  // lodash的inRange不能包含结尾，所以得用自己的
  function inRange(n, a, b) {
    if (a < b) {
      return n >= a && n <= b
    }
    return n <= a && n >= b
  }

  // 初始楼层队列
  function addFloorTask(task) {
    floorTasks.push(task)
  }
  // 已分配队列，当停在楼层时删除该队列对应的楼层任务
  // 为提示灯用
  let dispatchedQueue = []


  /* extend elevator prototype
   * @param Object proto
   * */
  function extendElevator(proto) {
    Object.assign(proto, {
      // 获取最近的楼层任务
      nearestTask() {
        let tasks = _.filter(floorTasks, t => !t.dispatched)
        tasks = _.sortBy(tasks, f => {
          return Math.abs(this.currentFloor() - f.floorNum)
        })
        return tasks[0]
      },
      
      /* 分配合适的下一个任务
       * 直接去最远的任务，中间的任务交给passing_floor解决
       * 当上下都有任务时，如果都是向上则先去下面的，都是向下则先去上面的，有上有下时，先去这两个里面较近的一个
       */
      nextTask() {
        let tasks = _.filter(floorTasks, t => !t.dispatched)
        let currentFloor = this.currentFloor()
        let higher = _.filter(tasks, t => {
          return t.floorNum > currentFloor
        })
        let lower = _.filter(tasks, t => {
          return t.floorNum < currentFloor
        })
        higher = _.sortBy(higher, t => {
          return t.floorNum
        })
        lower = _.sortBy(lower, t => {
          return t.floorNum
        })

        let highest = higher[higher.length - 1]
        let lowest = lower[0]

        if (highest && !lowest) {
          return highest
        }
        if (lowest && !highest) {
          return lowest
        }
        if (lowest && highest) {
          let downDistance = currentFloor - lowest.floorNum
          let upDistance = lowest.floorNum - currentFloor 
          if (lowest.up && !highest.up) {
            return downDistance > upDistance ? highest : lowest
          }
          if (lowest.up && highest.up) {
            return lowest
          }
          if (!lowest.up && highest.up) {
            return downDistance < upDistance ? highest : lowest
          }
          if (!lowest.up && !highest.up) {
            return highest
          }
        }

      },

      isUp() {
        return  this.isAtBottom() || this.destinationDirection() === 'up' || this.destinationQueue[0] > this.currentFloor()
      },
      isDown() {
        return this.isAtTop() || this.destinationDirection() === 'down' || this.destinationQueue[0] < this.currentFloor()
      },

      isAtBottom() {
        return this.currentFloor() === 0
      },
      isAtTop() {
        return this.currentFloor() === this.floors.length - 1
      },

      isStopped() {
        return this.destinationDirection() === 'stopped'
      },

      // 4人电梯人满两男两女时为0.78
      isAvailable() {
        return this.loadFactor() < 0.78
      },
      isIdle() {
        // console.log(JSON.stringify(this.destinationQueue))
        return this.destinationQueue.length === 0
      },

      indicateUp() {
        this.goingUpIndicator(true)
        this.goingDownIndicator(false)
      },
      indicateDown() {
        this.goingUpIndicator(false)
        this.goingDownIndicator(true)
      },

      // 显示正确的指示灯
      autoIndicate() {
        if (this.isUp()) {
          this.indicateUp()
          return
        }
        if (this.isDown()) {
          this.indicateDown()
          return
        }
        if (!this.destinationQueue.length) {
          // console.log('light all')
          this.goingUpIndicator(true)
          this.goingDownIndicator(true)
        }
      },

      /* 新楼层加入后为目标楼层排序
       * @param Number floorNum 新加入队列的楼层
      */
      // sortDestinationQueue() {
      //   let queue = this.destinationQueue
      //   let higher = queue.filter(f => f > this.currentFloor())
      //   let lower = queue.filter(f => f < this.currentFloor())
      //   if (this.isUp()) {
      //     this.destinationQueue = higher.sort(ascSort).concat(lower.sort(descSort))
      //   }
      //   if (this.isDown()) {
      //     this.destinationQueue = lower.sort(descSort).concat(higher.sort(ascSort))
      //   }
      //   this.destinationQueue = _.uniq(this.destinationQueue)
      //   this.checkDestinationQueue()
      //   this.autoIndicate()
      // },
    })
  }

  return {
    init: function(elevators, floors) {
      elevator = elevators[0]

      let elevatorProto = elevator.__proto__
      extendElevator(elevatorProto)

      elevators.forEach((e, i) => {
        e.sn = i
        e.indicateUp()

        e.on('floor_button_pressed', floorNum => {
          let queue = e.destinationQueue
          if (!queue.length) {
            e.goToFloor(floorNum)
            e.autoIndicate()
            return
          }
          if (queue.includes(floorNum)) {
            return
          }
          if (e.isUp() && queue.length && inRange(floorNum, e.currentFloor(), Math.max(...e.destinationQueue))) {
            queue.splice(_.sortedIndex(queue, floorNum), 0, floorNum)
            e.checkDestinationQueue()
            return
          }
          if (e.isDown() && queue.length && inRange(floorNum, Math.min(...e.destinationQueue), e.currentFloor())) {
            queue.splice(_.sortedLastIndex(queue, floorNum), 0, floorNum)
            e.checkDestinationQueue()
            return
          }
          e.goToFloor(floorNum)
          e.autoIndicate()
        })

        e.on('idle', () => {
          e.autoIndicate()
          // console.log('when idle floorTasks is', floorTasks)
          dispatchFloorTask(elevators)
        })

        e.on('stopped_at_floor', floorNum => {
          e.autoIndicate()
          // console.log(e.isIdle())
          if (e.isIdle()) {
            _.remove(floorTasks, {
              floorNum
            })
          } else {
            _.remove(floorTasks, {
              dispatched: true,
              floorNum
            })
          }
        })

        e.on('passing_floor', (floorNum, direction) => {
          console.log('e ' + e.sn + ' available is ' + e.isAvailable())
          console.log('e ' + e.sn + ' loadFactor is ' + e.loadFactor())
          if (!e.isAvailable()) {
            return
          }
          let task = _.find(floorTasks, f => {
            return f.floorNum === floorNum && direction === f.direction && !f.dispatched
          })
          if (task) {
            e.goToFloor(floorNum, true)
            task.dispatched = true
          }
        })

        e.floors = floors
      })

      /* 处理楼层生成的任务
       * @param Array elevators
       * @param Object task
       * @return Bool, true: task dispatched; false task not dispatched, still in out queue
       * */
      window.floorTasks = []
      function dispatchFloorTask(elevators) {
        let enabled = elevators.filter(e => e.loadFactor() <= 1)
        if (!enabled.length) {
          console.log('elevators all full')
          return false
        }
        enabled = _.sortBy(enabled, e => e.loadFactor())
        // console.log(enabled)

        // 先选负载少的
        let e = enabled[0]
        let task = e.nextTask()
        if (task) {
          e.goToFloor(task.floorNum)
          task.dispatched = true
          e.autoIndicate()
          return
        }
        task = e.nearestTask()
        if (task) {
          e.goToFloor(task.floorNum)
          task.dispatched = true
          e.autoIndicate()
        }
      }

      window.floors = floors
      floors.forEach(f => {

        f.on('up_button_pressed', () => {
          let task = {
            direction: 'up',
            up: true,
            floorNum: f.floorNum()
          }
          if (_.find(floorTasks, task)) {
            return
          }
          addFloorTask(task)
          if (_.every(elevators, e => e.isIdle())) {
            dispatchFloorTask(elevators)
          }
        })
        f.on('down_button_pressed', () => {
          let task = {
            direction: 'down',
            up: false,
            floorNum: f.floorNum()
          }
          if (_.find(floorTasks, task)) {
            return
          }
          addFloorTask(task)
          if (_.every(elevators, e => e.isIdle())) {
            dispatchFloorTask(elevators)
          }
        })
      })
    },

    update: function(dt, elevators, floors) {
    },
  }
})()
