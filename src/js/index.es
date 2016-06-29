// challenge 1-10, 以电梯为主导，但10关之后可能应该以楼层为主导
;(function() {

  var floorTasks = []
  window.floorTasks = floorTasks

  function logTask(task, elevator) {
    console.log('task ' + JSON.stringify(task) + ' is dispatched to ', elevator.sn)
  }

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
    task.time = _.now()
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
        // let tasks = _.filter(floorTasks, t => !t.dispatched)
        let tasks = floorTasks
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
        let tasks = floorTasks
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

      // 一开始被负载骗了以为1才会满，其实是按重量不是按人数，大概大于0.7人就已经满了,文档也说这只是个参考值
      isAvailable() {
        return this.loadFactor() < 0.68
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
      window.elevators = elevators

      let elevatorProto = elevator.__proto__
      extendElevator(elevatorProto)

      elevators.forEach((e, i) => {
        e.sn = i
        e.indicateUp()

        e.on('floor_button_pressed', floorNum => {
          let queue = e.destinationQueue
          let currentFloor = e.currentFloor()
          function checkRemoveTask() {
            let task = _.find(floorTasks, {
              floorNum: currentFloor,
              up: e.isUp()
            })
            if (task) {
              _.remove(floorTasks, task)
            }
          }
          if (!queue.length) {
            e.goToFloor(floorNum)
            e.autoIndicate()
            checkRemoveTask()
            return
          }
          if (queue.includes(floorNum)) {
            return
          }
          if (e.isUp() && queue.length && inRange(floorNum, currentFloor, Math.max(...e.destinationQueue))) {
            queue.splice(_.sortedIndex(queue, floorNum), 0, floorNum)
            e.checkDestinationQueue()
            checkRemoveTask()
            return
          }
          if (e.isDown() && queue.length && inRange(floorNum, Math.min(...e.destinationQueue), currentFloor)) {
            queue.splice(_.sortedLastIndex(queue, floorNum), 0, floorNum)
            e.checkDestinationQueue()
            checkRemoveTask()
            return
          }
          e.goToFloor(floorNum)
          e.autoIndicate()
          checkRemoveTask()
        })

        e.on('idle', () => {
          e.autoIndicate()
          // console.log('when idle floorTasks is', floorTasks)
          dispatchFloorTask(elevators)
        })

        e.on('stopped_at_floor', floorNum => {
          e.autoIndicate()
          // if (e.isIdle()) {
          //   _.remove(floorTasks, {
          //     floorNum
          //   })
          // } else {
          //   _.remove(floorTasks, {
          //     dispatched: true,
          //     floorNum
          //   })
          // }
        })

        e.on('passing_floor', (floorNum, direction) => {
          // console.log('e ' + e.sn + ' available is ' + e.isAvailable())
          // console.log('e ' + e.sn + ' loadFactor is ' + e.loadFactor())
          if (!e.isAvailable()) {
            return
          }
          let task = _.find(floorTasks, f => {
            return f.floorNum === floorNum && direction === f.direction
          })
          if (task) {
            e.goToFloor(floorNum, true)
            _.remove(floorTasks, task)
          }
        })

        e.floors = floors
      })

      /* 处理楼层生成的任务
       * @param Array elevators
       * @param Object task
       * @return Bool, true: task dispatched; false task not dispatched, still in out queue
       * */
      function dispatchFloorTask(elevators) {
        let enabled = elevators.filter(e => e.isAvailable())
        if (!enabled.length) {
          console.log('elevators all full')
          return false
        }

        // 先选空的再选负载小的
        idles = enabled.filter(e => e.isIdle())
        let e
        if (idles.length) {
          // idles = _.sortBy(idles, e => Math.abs(e.currentFloor() - e.nextTask().floorNum))
          e = idles[0]
          // let now = _.now()
          // let waitTooLong = _.find(floorTasks, t => now - t.time >= 14000)
          // if (waitTooLong) {
          //   console.log('task ' + JSON.stringify(waitTooLong) + ' is dispatched to ', e.sn)
          //   e.goToFloor(waitTooLong.floorNum, true)
          //   _.remove(floorTasks, waitTooLong)
          //   e.autoIndicate()
          // }
        } else {
          enabled = _.sortBy(enabled, e => e.loadFactor())
          e = enabled[0]
        }
        if (!e) {
          return
        }

        let task = e.nextTask()
        if (task) {
          e.goToFloor(task.floorNum)
          // task.dispatched = true
          logTask(task, e)
          _.remove(floorTasks, task)
          e.autoIndicate()
          return
        }
        task = e.nearestTask()
        if (task) {
          e.goToFloor(task.floorNum)
          // task.dispatched = true
          logTask(task, e)
          _.remove(floorTasks, task)
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
          let idleElevator = _.find(elevators, e => {
            return e.currentFloor() === task.floorNum &&
              (e.isIdle() || (e.isAvailable() && (e.isStopped() && e.isUp())))
          })
          if (idleElevator) {
            idleElevator.indicateUp()
            return
          }
          addFloorTask(task)
          if (_.some(elevators, e => e.isIdle())) {
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
          let idleElevator = _.find(elevators, e => {
            return e.currentFloor() === task.floorNum &&
              (e.isIdle() || (e.isAvailable() && (e.isStopped() && e.isDown())))
          })
          if (idleElevator) {
            idleElevator.indicateDown()
            return
          }
          addFloorTask(task)
          if (_.some(elevators, e => e.isIdle())) {
            dispatchFloorTask(elevators)
          }
        })
      })
    },

    update(dt, elevators, floors) {
    },
  }
})()
