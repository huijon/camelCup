

var _ = require('lodash');
var Chance = require('chance');
var chance = new Chance();

var CAMEL_ID = 1;

var colours = ['red', 'yellow', 'green', 'blue', 'white'];

var createCamel = function (square, colour) {
  return {
    id: CAMEL_ID++,
    colour: colour
  }
};

var rollDice = function () {
  var possibilities = [1, 2, 3];
  var face = _.sample(possibilities);
  return {
    possibilities: possibilities,
    face: face
  };
};

var getDice = function() {
  var possibilities = [1, 2, 3];
  var face = _.sample(possibilities);
  return {
    possibilities: possibilities,
    face: face
  };
};

var emptyBoard = function(size, camels) {
  return {
    size: size,         // number of squares on this board
    positions: [],      // board state: each element is an array representing the camels on that space
    camels_moved: [],   // array of camel_ids that have already moved,
    camels_in_game: _.pluck(camels, 'id')  // array of camel_ids in the entire game
  }
};

var createBoard = function (camels, emptyBoard) {
  var board = emptyBoard;

  // move each camel to get their starting position
  _.each(camels, function(camel){
    var diceResult = rollDice();
    board = updateBoard(camel, diceResult, board);
  });

  // clear camels having moved
  board.camels_moved = [];
  return board;
};

// camel always gets pushed onto the end of the array
var updateBoard = function (camel, diceResult, board) {

  // check if the camel can move
  var camelCanMove = !_.find(board.camels_moved, { id: camel.id });
  if (!camelCanMove) {
    console.error('cant move this camel again');
    return board;
  }
  board.camels_moved.push(camel.id);

  // extend the board positions if required
  if (board.positions.length <= diceResult.face) {
    for (var i = board.positions.length; i <= diceResult.face; i++) {
      board.positions[i] = [];
    }
  }

  // put the camel in the right position
  board.positions[diceResult.face].push(camel);

  return board;
};

var startGame = function () {
  var camels = _.map(colours, function(colour) {
    return createCamel(0, colour);
  });

  var board = createBoard(camels, emptyBoard(16, camels));

  printBoard(board);
  calculateOutcomes(board);
};

var isCamel = function(stackHeight) {
  return !_.isEmpty(stackHeight);
};

var printBoard = function (board) {
  _.each(board.positions, function(positions, idx) {
    if (idx > 0) {
      console.log('POSITION %s', idx);
    }
    if (positions.length > 0) {
      _.each(positions, function(stackHeight){
        if (isCamel(stackHeight)) {
          var camel = stackHeight;
          console.log('\t camel: %s, %s', camel.id, camel.colour);
          console.log('pos: ', getCamelPositionAndStackHeight(camel, board));
        }
      });
    }
  });

  console.log('\n\nboard: ', board);
};

var getCamelPosition = function (camel, board) {
  var position = undefined;
  _.some(board.positions, function(camels, idx) {
    if (camels.length > 0) {
      if (!!_.find(camels, { id: camel.id })){
        position = idx;
        return true;
      }
    }
    return false;
  });
  return position;
};

// get where the camel is at it's position
var getCamelStackHeight = function (camel, board) {
  var rank = undefined;
  var position = getCamelPosition(camel, board);
  _.some(board.positions[position], function(c, idx){
    if (c.id === camel.id){
      rank = idx;
      return true;
    }
  });
  return rank;
};

var getCamelPositionAndStackHeight = function(camel, board) {
  return {
    position: getCamelPosition(camel, board),
    stackHeight: getCamelStackHeight(camel, board)
  };
};


var hashPath = function(path) {
  var hash = '';
  //console.log(path.length);
  if (path.length === 5) {
    _.each(path, function (segment) {
      hash += segment.camel + '' + segment.dice;
    });
    return hash;
  }
  throw Error('path isnt 5 long: ' + path.length);
  //process.exit(1);
};

var outcomes = [];


var count = 0;
var calculateOutcome = function (path, possibilities) {
  count++;

  if (possibilities.length === 0) {
    var hash = hashPath(path);

    if (_.includes(outcomes, hash)){
      throw Error('duplicate hash: ', hash);
    }

    outcomes.push(hash);
    return;
  }
  _.each(possibilities, function(poss, idx) {
    var new_path = _.clone(path);
    new_path.push(poss);
    var drop_camel = _.reject(possibilities, function(po) {
      return (po.camel === poss.camel);
    });

    if (drop_camel.length !== possibilities.length - 3) {
      throw error('didnt drop camel');
    }
    calculateOutcome(new_path, drop_camel);
  });
};

var calculateOutcomes = function (board) {

  var possibilities = [];

  var camels_not_moved = _.difference(board.camels_in_game, board.camels_moved);

  _.each(camels_not_moved, function(unmoved_camel) {
    _.each(getDice().possibilities, function(possibleDiceRoll) {
      possibilities.push({ camel: unmoved_camel, dice: possibleDiceRoll });
    });
  });

  calculateOutcome([], possibilities);
  console.log('FINISHED: ', outcomes.length);
};

startGame();