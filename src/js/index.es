;(function(){
  function uniqArray(arr) {
    if (!Array.isArray(arr)) {
      throw new Error('param must be array')
    }
    return arr.filter((v, i) => {
      return arr.indexOf(v) === i
    })
  }

  // 任务队列
  let arrangeQueue = []
  let excuteQueue = []

  let floorQueue = []

  /*
   * param elevators Array, elevators array
   * */
  const extendElevatorProto = function(elevators, floors) {
    // 扩展电梯对象方法
    let elevatorProto = {
      indicate() {
        console.log('in indicate: ', this.destinationQueue)
        let direction = this.destinationDirection()
        if (this.isAtTop()) {
          this.goingDownIndicator(true)
          this.goingUpIndicator(false)
          return
        }
        if (this.isAtBottom()) {
          this.goingDownIndicator(false)
          this.goingUpIndicator(true)
          return
        }
        if (this.isUp()) {
          this.goingDownIndicator(false)
          this.goingUpIndicator(true)
        } else if (this.isDown()) {
          this.goingDownIndicator(true)
          this.goingUpIndicator(false)
        } else if (this.isStopped()) {
          this.goingDownIndicator(false)
          this.goingUpIndicator(false)
        }
      },
      isStopped() {
        return this.destinationDirection() === 'stopped'
      },
      isUp() {
        let up = false
        if (this.destinationDirection() === 'up') {
          up = true
        } else if (this.isStooped() &&
          this.destinationQueue.length &&
          this.destinationQueue[0] > this.currentFloor()) {
          up = true
        }
        return up
      },

      isDown() {
        let down = false
        if (this.destinationDirection() === 'down') {
          down = true
        } else if (this.isStooped() &&
                   this.destinationQueue.length &&
                   this.destinationQueue[0] < this.currentFloor()) {
          down = true
        }
        return down
      },

      // 是否已经到顶层
      isAtTop() {
        this.currentFloor() === floors.length - 1
      },
      // 是否已到最底层
      isAtBottom() {
        this.currentFloor() === 0
      },

      isStooped() {
        return this.destinationDirection() === 'stopped'
      },

      // 重新排列目的地顺序
      resortDestinationQueue() {
        if (!this.destinationQueue.length) {
          return
        }

        this.destinationQueue = uniqArray(this.destinationQueue)

        var currentFloor = this.currentFloor()

        var upSideFloors, downSideFloors

        console.log('电梯%d排序之前数组', this.sn, this.destinationQueue)
        if (this.isUp) {
          upSideFloors = this.destinationQueue.filter(function(f) {
            return f >= currentFloor
          })
          downSideFloors = this.destinationQueue.filter(function(f) {
            return f < currentFloor
          })
          upSideFloors.sort()
          this.destinationQueue = upSideFloors.concat(downSideFloors)
          console.log('电梯%d在向上走的情况下，当前层', this.sn, currentFloor, '上层数组', upSideFloors, '下层数组', downSideFloors)
        }
        if (this.isDown()) {
          upSideFloors = this.destinationQueue.filter(function(f) {
            return f > currentFloor
          })
          downSideFloors = this.destinationQueue.filter(function(f) {
            return f <= currentFloor
          })
          downSideFloors.sort(function(a, b) {
            return a < b
          })
          this.destinationQueue = downSideFloors.concat(upSideFloors)
          console.log('电梯%d在向下走的情况下，当前层', this.sn, currentFloor, '上层数组', upSideFloors, '下层数组', downSideFloors)
        }
        this.checkDestinationQueue()
        this.indicate()
        console.log('电梯%d排序之后数组', this.sn, this.destinationQueue)
      },
    }
    let elevator = elevators[0]
    console.log(elevator)
    Object.assign(elevator.__proto__, elevatorProto)
  }

  return {
    init: function(elevators, floors) {
      extendElevatorProto(elevators)
    },

    update: function(dt, elevators, floors) {
      if (floorQueue.length) {
        floorQueue.forEach(queue => {
          queue.floor.trigger(queue.event)
        })
      }
      elevators.forEach(e => e.indicate)
    },
  }
})()
