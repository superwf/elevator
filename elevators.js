// for multiple elevators
{
  init: function(elevators, floors) {
    var uniqArray = function(arr) {
      if (!Array.isArray(arr)) {
        throw new Error('param must be array')
      }
      return arr.filter(function(v, i) {
        return arr.indexOf(v) === i
      })
    }

    var isUp = function(elev) {
      if (elev.destinationDirection() === 'up') {
        return true
      } else if (isStooped(elev) &&
                 elev.destinationQueue.length &&
                 elev.destinationQueue[0] > elev.currentFloor()) {
        return true
      }
      return false
    }

    var isDown = function(elev) {
      if (elev.destinationDirection() === 'down') {
        return true
      } else if (isStooped(elev) &&
                elev.destinationQueue.length &&
                elev.destinationQueue[0] < elev.currentFloor()) {
        return true
      }
      return false
    }

    // 是否已经到顶层
    var isAtHighest = function(elev) {
      elev.currentFloor() === floors.length - 1
    }
    // 是否已到最底层
    var isAtLowest = function(elev) {
      elev.currentFloor() === 0
    }

    var isStooped = function(elev) {
      return elev.destinationDirection() === 'stopped'
    }

    // 重新排列目的地顺序
    var resortDestinationQueue = function(elev) {
      if (!elev.destinationQueue.length) {
        return
      }

      elev.destinationQueue = uniqArray(elev.destinationQueue)

      var currentFloor = elev.currentFloor()

      var upSideFloors, downSideFloors

      console.log('排序之前数组', elev.destinationQueue)
      if (isUp(elev)) {
        upSideFloors = elev.destinationQueue.filter(function(f) {
          return f >= currentFloor
        })
        downSideFloors = elev.destinationQueue.filter(function(f) {
          return f < currentFloor
        })
        upSideFloors.sort()
        elev.destinationQueue = upSideFloors.concat(downSideFloors)
        console.log('在向上走的情况下，当前层', currentFloor, '上层数组', upSideFloors, '下层数组', downSideFloors)
      }
      if (isDown(elev)) {
        upSideFloors = elev.destinationQueue.filter(function(f) {
          return f > currentFloor
        })
        downSideFloors = elev.destinationQueue.filter(function(f) {
          return f <= currentFloor
        })
        downSideFloors.sort(function(a, b) {
          return a < b
        })
        elev.destinationQueue = downSideFloors.concat(upSideFloors)
        console.log('在向下走的情况下，当前层', currentFloor, '上层数组', upSideFloors, '下层数组', downSideFloors)
      }
      elev.checkDestinationQueue()
      console.log('排序之后数组', elev.destinationQueue)

    }


    let self = this

    // 平均分配工作给每个电梯
    // 当前分配工作的电梯的索引
    let workingIndex = 0
    let dispatchJob = (floorNum) => {

      if (workingIndex > elevators.length - 1) {
        workingIndex = 0
      }
      let elevator = elevators[workingIndex]
      workingIndex++
      if (elevator.loadFactor() < 1) {
        elevator.goToFloor(floorNum)
        resortDestinationQueue(elevator)
      } else {
        dispatchJob(floorNum)
      }
    }

    let processFloor = function(event) {
      let func = function(floor) {
        // 如果全满了
        if(elevators.every(function(elev) {
          return elev.loadFactor() >= 1
        })) {
          self.floorQueue.push({event, floor: floor})
        }

        let floorNum = floors.indexOf(floor)
        dispatchJob(floorNum)
      }
      return func
    }

    floors.map(function(floor) {
      floor.on('up_button_pressed', processFloor('up_button_pressed'))
      floor.on('down_button_pressed', processFloor('down_button_pressed'))
    })

    for (let elevator of elevators) {
      elevator.on("floor_button_pressed", function(floorNum) {
        elevator.goToFloor(floorNum)

        resortDestinationQueue(elevator)
        console.log('floor_button_pressed ', floorNum)
        console.log(elevator.destinationQueue)
      })

      elevator.on("idle", function() {
        console.log('idel')
        console.log(elevator.destinationQueue)
      })
    }

  },

  floorQueue: [],

  update: function(dt, elevators, floors) {
    if (this.floorQueue.length) {
      this.floorQueue.forEach(queue => {
        queue.floor.trigger(queue.event)
      })
    }
  },
}
