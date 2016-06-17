// for single elevator
{
  init: function(elevators, floors) {
    var self = this
    var elevator = elevators[0]; // Let's use the first elevator

    var floorIndex = 0, floor

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

    var floorUpQueue = []

    // usage: floorUpQueue.sort(sortFloorQueue)
    var sortFloorQueue = function(a, b) {
      a.num > b.num
    }
    var desortFloorQueue = function(a, b) {
      a.num < b.num
    }

    var floorDownQueue = []

    for (;floorIndex < floors.length; floorIndex++) {
      let floor = floors[floorIndex]
      floor.on('up_button_pressed', function() {
        var floorNum = floors.indexOf(floor)
        floorUpQueue.push({num: floorNum, dir: 'up'})
        elevator.goToFloor(floorNum)
        resortDestinationQueue(elevator)
      })

      floor.on('down_button_pressed', function() {
        var floorNum = floors.indexOf(floor)
        floorDownQueue.push({num: floorNum, dir: 'down'})

        elevator.goToFloor(floorNum)
        resortDestinationQueue(elevator)
      })

    }

    elevator.on("floor_button_pressed", function(floorNum) {
      elevator.goToFloor(floorNum)

      resortDestinationQueue(elevator)
      console.log('floor_button_pressed ', floorNum)
      console.log(elevator.destinationQueue)
    })

    elevator.on("idle", function() {
      console.log('idel')
      var floors = elevator.getPressedFloors()
      if (floors.length) {
        for (let floor of floors) {
          let floorNum = floor.floorNum()
          elevator.destinationQueue.push(floorNum)
        }
        resortDestinationQueue(elevator)
      }
      console.log(elevator.destinationQueue)
    })

  },
  update: function(dt, elevators, floors) {
      // We normally don't need to do anything here
  },
}
