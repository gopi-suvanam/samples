

var depth=3;
var board,
    game = new Chess();

var job_id=null;
var scope={};
scope['job_id']=null;
var newGameMoves;
var job_status=function(){
		
		success=function(data){

			scope['status']=data['status'];
			if (data['counts']==undefined || data['counts']['completed']==undefined)
				scope['percentage']=0.0;
			else {
				scope['percentage']=100*data['counts']['completed']/parseFloat(newGameMoves.length);
				$('#percent-complete').text(scope['percentage']+'%');
			}
			if(scope['status']!='completed') {setTimeout(job_status, 500);}

			else{
				$.get('/job/'+scope['job_id']+'/result',function(result){
						var bestMove = -9999;
						for(var i = 0; i < newGameMoves.length; i++) {
							positionCount=positionCount+result[i]['pos_count'];
							
							if(result[i]['bestMove'] >= bestMove) {
								bestMove = result[i]['bestMove'];
								bestMoveFound = newGameMoves[i];
							}
						}
						foundBestMove(bestMoveFound) ;
				});
				
			}
		
		}


		$.get('/job/'+scope.job_id+'/status',success);

	};
	

/*The "AI" part starts here */
var minimaxRoot =function(depth1, game, isMaximisingPlayer) {

    newGameMoves = game.ugly_moves();
    var bestMoveFound;
    positionCount = 0;
	var values=[];
	var args=[];
    for(var i = 0; i < newGameMoves.length; i++) {
        var newGameMove = newGameMoves[i];
        game.ugly_move(newGameMove);
        args.push( [depth1 - 1, game.fen(), -10000, 10000, !isMaximisingPlayer]);
		game.undo();
	}
	func='return minimax_entry(arg);';
	resources=[window.location.origin+"/chess/lib/js/chess.js",window.location.origin+"/chess/minimax.js"];
	post_job(func,JSON.stringify(args),'',"chess step",resources,job_status,scope);
	/*for (var i = 0; i < newGameMoves.length; i++) {
		values.push(minimax_entry(args[i]));
	}
	for(var i = 0; i < newGameMoves.length; i++) {
		positionCount=positionCount+values[i]['pos_count'];
        
        if(values[i]['bestMove'] >= bestMove) {
            bestMove = values[i]['bestMove'];
            bestMoveFound = newGameMoves[i];
        }
    }
    foundBestMove(bestMoveFound) ;*/
};



/* board visualization and games state handling */

var onDragStart = function (source, piece, position, orientation) {
    if (game.in_checkmate() === true || game.in_draw() === true ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var makeBestMove = function () {
    getBestMove(game);

};


var positionCount;
var foundBestMove=function(bestMove){
	d2 = new Date().getTime();
    var moveTime = (d2 - d);
    var positionsPerS = ( positionCount * 1000 / moveTime);

    $('#position-count').text(positionCount);
    $('#time').text(moveTime/1000 + 's');
	if(moveTime>10000) depth=Math.max(depth-1,3);
	if(moveTime<1000) depth=Math.min(depth+1,10);
	 $('#search-depth').text(depth);
    $('#positions-per-s').text(positionsPerS);
    game.ugly_move(bestMove);
    board.position(game.fen());
    renderMoveHistory(game.history());
    if (game.game_over()) {
        alert('Game over');
    }
}
var getBestMove = function (game) {
    if (game.game_over()) {
        alert('Game over');
    }

    //var depth = parseInt($('#search-depth').find(':selected').text());

    d= new Date().getTime();
    minimaxRoot(depth, game, true);
	
};

var renderMoveHistory = function (moves) {
    var historyElement = $('#move-history').empty();
    historyElement.empty();
    for (var i = 0; i < moves.length; i = i + 2) {
        historyElement.append('<span>' + moves[i] + ' ' + ( moves[i + 1] ? moves[i + 1] : ' ') + '</span><br>')
    }
    historyElement.scrollTop(historyElement[0].scrollHeight);

};

var onDrop = function (source, target) {

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    removeGreySquares();
    if (move === null) {
        return 'snapback';
    }

    renderMoveHistory(game.history());
    window.setTimeout(makeBestMove, 250);
};

var onSnapEnd = function () {
    board.position(game.fen());
};

var onMouseoverSquare = function(square, piece) {
    var moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    greySquare(square);

    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function(square, piece) {
    removeGreySquares();
};

var removeGreySquares = function() {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function(square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
};
board = ChessBoard('board', cfg);