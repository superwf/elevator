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


  /* 处理楼层生成的任务
   * @param Array elevators
   * @param Object task
   * @return Bool, true: task dispatched; false task not dispatched, still in out queue
   * */
  let floorQueue = []
  window.floorQueue = floorQueue
  function dispatchOutTask(elevators, task) {
    let enabled = elevators.filter(e => e.loadFactor() <= 1)
    if (!enabled.length) {
      floorQueue.push(task)
      floorQueue = _.uniq(floorQueue)
      console.log('elevators all full')
      return false
    }
    enabled = _.sortBy(enabled, e => e.loadFactor())

    // TODO 选择离的近的
    // 目前先选负载少的
    let worker = enabled[0]

    let floorNum = task.floorNum
    let queue = worker.destinationQueue
    // console.log(queue)
    if (!queue.length) {
      console.log('空队列插入', task)
      worker.goToFloor(floorNum)
      worker.sortDestinationQueue()
      return true
    }
    // 在目标范围内
    let currentFloor = worker.currentFloor()
    if (inRange(floorNum, currentFloor, _.last(queue))) {
      if ((worker.isUp() && task.direction === 'Up') ||
          (worker.isDown() && task.direction === 'Down')) {
        console.log('顺路插入', task)
        worker.goToFloor(floorNum)
        worker.sortDestinationQueue()
        return true
      }
    }

    floorQueue.push(task)
    floorQueue = _.uniq(floorQueue)
    console.log('排入floor队列', floorQueue)
    return false
  }

  function runFloorQueue(elevators) {
    if (floorQueue.length) {
      dispatchOutTask(elevators, floorQueue[0])
    }
  }

  /* extend elevator prototype
   * @param Object proto
   * */
  function extendElevator(proto) {
    Object.assign(proto, {
      isUp() {
        return this.destinationDirection() === 'up' || (
          this.destinationQueue[0] > this.currentFloor()
        )
      },
      isDown() {
        return this.destinationDirection() === 'down' || (
          this.destinationQueue[0] < this.currentFloor()
        )
      },

      isStopped() {
        return this.destinationDirection() === 'stopped'
      },
      isFull() {
        return this.loadFactor() >= 1
      },

      // 关闭所有指示灯
      turnOffIndicator() {
        this.goingUpIndicator(false)
        this.goingDownIndicator(false)
      },
      turnOnIndicator() {
        this.goingUpIndicator(true)
        this.goingDownIndicator(true)
      },

      // 显示正确的指示灯
      indicate() {
        if (this.isUp()) {
          this.goingUpIndicator(true)
          this.goingDownIndicator(false)
        } else if (this.isDown()) {
          this.goingUpIndicator(false)
          this.goingDownIndicator(true)
        }
        // } else if (this.isStopped() && !this.destinationQueue.length) {
          // this.turnOffIndicator()
        // }
        if (this.currentFloor() === 0) {
          this.goingUpIndicator(true)
          this.goingDownIndicator(false)
        }
        if (this.currentFloor() === this.floors.length) {
          this.goingUpIndicator(false)
          this.goingDownIndicator(true)
        }
      },

      /* 新楼层加入后为目标楼层排序
       * @param Number floorNum 新加入队列的楼层
      */
      sortDestinationQueue() {
        let queue = this.destinationQueue
        let higher = queue.filter(f => f >= this.currentFloor())
        let lower = queue.filter(f => f < this.currentFloor())
        if (this.isUp()) {
          this.destinationQueue = higher.sort(ascSort).concat(lower.sort(descSort))
        }
        if (this.isDown()) {
          this.destinationQueue = lower.sort(descSort).concat(lower.sort(ascSort))
        }
        this.destinationQueue = _.uniq(this.destinationQueue)
        this.checkDestinationQueue()
        this.indicate()
      },
    })
  }

  return {
    init: function(elevators, floors) {
      elevator = elevators[0]

      let elevatorProto = elevator.__proto__
      extendElevator(elevatorProto)

      elevators.forEach(e => {
        // 将要执行的任务队列
        // 外部生成的任务队列
        e.outQueue = []

        // 正在执行的队列
        // 里面添加的队列，里面优先执行
        e.inQueue = []

        e.on('floor_button_pressed', floorNum => {
          let currentFloor = e.currentFloor()
          let queue = e.destinationQueue
          if (!_.includes(queue, floorNum)) {
            if (inRange(floorNum, currentFloor, _.last(queue))) {
              let index = _.sortedIndex(e.destinationQueue, floorNum)
              queue.splice(index, 0, floorNum)
              e.checkDestinationQueue()
            } else {
              e.goToFloor(floorNum)
            }
            e.sortDestinationQueue()
          }
          runFloorQueue(elevators)
        })

        e.on('idle', () => {
          console.log('idel')
          runFloorQueue(elevators)
        })

        e.on('stopped_at_floor', floorNum => {
          e.turnOnIndicator()
          let dest
          if (e.isUp()) {
            dest = {floorNum, direction: 'Up'}
          } else if (e.isDown()) {
            dest = {floorNum, direction: 'Down'}
          }
          if (_.find(floorQueue, dest)) {
            _.remove(floorQueue, dest)
          }
          console.log(floorQueue)
          console.log(e.destinationQueue)
          runFloorQueue(elevators)
        })

        e.floors = floors
      })

      floors.forEach(f => {
        f.on('up_button_pressed', () => {
          dispatchOutTask(elevators, {
            floorNum: f.floorNum(),
            direction: 'Up'
          })
        })
        f.on('down_button_pressed', () => {
          dispatchOutTask(elevators, {
            floorNum: f.floorNum(),
            direction: 'Down'
          })
        })
      })
    },

    update: function(dt, elevators, floors) {
    },
  }
})()
