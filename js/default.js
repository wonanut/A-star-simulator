// all the canvas.
var canvas = document.getElementById('can').getContext('2d');
var tip = document.getElementById('info').getContext('2d');
var update = document.getElementById('update').getContext('2d');
var modify = document.getElementById('modify').getContext('2d');
var simulate = document.getElementById('simulate').getContext('2d');

// define vertex to manage data.
function Vertex()
{
	this.type = 0;						//	0: none;  1: select;  2: start;  3: end;  4: closeList;  5: openList;  6: obstacle;  7: line;
	this.f = 0;
	this.g = 0;
	this.h = 0;
}

function Unit(x, y, g, h, fatherX, fatherY)
{
	this.x = x;
	this.y = y;
	this.g = g;
	this.h = h;
	this.f = this.g + this.h;
	this.fatherX = fatherX;
	this.fatherY = fatherY;
}

var openList = [];
var closeList = [];
var obstacleList = [];
var arr;

var tipText = "Initialisation Done.";

var curBlockX = 0;
var curBlockY = 0;
var startX = -1;
var startY = -1;
var endX = -1;
var endY = -1;
var modX = -1;
var modY = -1;

var brushMode = 0;						//  0: Pointer;  1: Clear;  2: Start;  3: End;  4: Obstacke;
var mode = 0;							//	0: custom mode;	1: modify mode
var isModifyFinish = false;

var number_of_blocks_col;
var number_of_blocks_row;

// static const value.
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 400;
const TIP_WIDTH = 894;
const TIP_HEIGHT = 40;
const BASIC_BLOCK_WIDTH = 40;
const BASIC_BLOCK_GIP = 2;

// define color.
const COLOR_BASIC = '#f2f2f2';
const COLOR_PINK = 'pink';
const COLOR_GREEN = 'green';
const COLOR_RED = 'red'
const COLOR_INSIDE = '#66CC66';
const COLOR_OUTSIDE = '#CCFF99';
const COLOR_OBSTACLE = '#8B4513';
const COLOR_PURPLE = '#1E63E9';

function _initCanvas()
{
	number_of_blocks_row = CANVAS_WIDTH / BASIC_BLOCK_WIDTH;
	number_of_blocks_col = CANVAS_HEIGHT / BASIC_BLOCK_WIDTH;

	document.getElementById('detail').style.display = "none";

	_init_arr();
	_init_tip();
	_init_toolbar();
	_showdetail();

	drawGridBlock();
	_drawBasicBlock(0*BASIC_BLOCK_WIDTH, 0*BASIC_BLOCK_WIDTH, 1);
}

function _init_arr()
{
	arr = new Array();
	for(var i = 0; i < number_of_blocks_col; i++)
	{
		arr[i] = new Array();
		for(var j = 0; j < number_of_blocks_row; j++)
		{
			arr[i][j] = new Vertex();
		}
	}
}

function _init_tip()
{
	tip.font = "16px Arial";
	tip.fillText(tipText, 20, 25);
}

function _init_toolbar()
{
	update.font = "16px Arial";
	update.fillStyle = "#fff";
	update.fillText("UPDATE", 15, 25);

	simulate.font = "16px Arial";
	simulate.fillStyle = "#fff";
	simulate.fillText("SIMULATE", 10, 25);

	modify.font = "16px Arial";
	modify.fillStyle = "#fff";
	modify.fillText("MODIFY", 15, 25);
}

function updateTip(text)
{
	tip.clearRect(0, 0, TIP_WIDTH, TIP_HEIGHT);
	tipText = text;
	tip.fillText(tipText, 20, 25);
}

function _modifyCurNode()
{
	if(!isModifyFinish)
	{
		var cur_unit_pos = get_min_in_openList();
		var cur_unit = openList[cur_unit_pos];
		openList.splice(cur_unit_pos, 1);
		closeList.push(cur_unit);
		updateTip('Push unit: (' + cur_unit.x + ',' + cur_unit.y + ') into the closeList');

		for(var i = cur_unit.x - 1; i < cur_unit.x + 2; i++)
		{
			for(var j = cur_unit.y - 1; j < cur_unit.y + 2; j++)
			{
				if(i >=0 && i < number_of_blocks_row && j >=0 && j < number_of_blocks_col)
				{
					var temp_g, temp_h;
					var openList_pos =  is_in_openList(i, j);
					if(i == cur_unit.x || j == cur_unit.y)
					{
						temp_g = 10 + cur_unit.g;
					}
					else
					{
						temp_g = 14 + cur_unit.g;
					}
					temp_h = get_manhattan_distance(i, j, endX, endY);

					if(is_in_closeList(i, j) == -1 && openList_pos == -1 && is_in_obstacleList(i, j) == -1)
					{
						var temp_unit = new Unit(i, j, temp_g, temp_h, cur_unit.x, cur_unit.y);
						openList.push(temp_unit);
					}

					if(openList_pos > -1)
					{
						if(temp_g + temp_h < openList[openList_pos].f)
						{
							openList[openList_pos].g = temp_g;
							openList[openList_pos].h = temp_h;
							openList[openList_pos].f = temp_g + temp_h;
							openList[openList_pos].fatherX = cur_unit.x;
							openList[openList_pos].fatherY = cur_unit.y;
						}
					}
				}
			}
		}
		drawGridBlock_bg();
		drawBlock();
	}

	var openList_pos = is_in_openList(endX, endY);
	if(openList_pos > -1)
	{
		isModifyFinish = true;
		updateTip('Modify finish.');
		drawRoutine();
	}
	if(openList.length == 0)
	{
		isModifyFinish = true;
		updateTip('Oppose, there may not have solution.');
	}
}

function _drawBasicBlock(pos_x, pos_y, type, g = 0, h = 0)
{
	switch(type)
	{
		case 0: 
			canvas.fillStyle = COLOR_BASIC;	
			canvas.fillRect(pos_x, pos_y, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP);
			break;
		case 1: 
			canvas.fillStyle = COLOR_PINK; 
			canvas.fillRect(pos_x, pos_y, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP);
			break;
		case 2: 
			canvas.fillStyle = COLOR_GREEN; 
			canvas.fillRect(pos_x, pos_y, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP);
			canvas.font = "16px Arial";
			canvas.fillStyle = "#fff";
			canvas.fillText("S", pos_x + 15, pos_y + 25);
			break;
		case 3: 
			canvas.fillStyle = COLOR_RED; 
			canvas.fillRect(pos_x, pos_y, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP);
			canvas.font = "16px Arial";
			canvas.fillStyle = "#fff";
			canvas.fillText("E", pos_x + 15, pos_y + 25);
			break;
		case 4:
			canvas.fillStyle = COLOR_INSIDE;
			canvas.fillRect(pos_x, pos_y, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP);
			canvas.font = "8px Arial";
			canvas.fillStyle = "#fff";
			canvas.fillText(g, pos_x + 3, pos_y + 33);
			canvas.fillText(h, pos_x + 23, pos_y + 33);
			canvas.font = "14px Arial";
			canvas.fillText(g + h, pos_x + 3, pos_y + 15);
			break;
		case 5:
			canvas.fillStyle = COLOR_OUTSIDE;
			canvas.fillRect(pos_x, pos_y, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP);
			canvas.font = "8px Arial";
			canvas.fillStyle = "#888";
			canvas.fillText(g, pos_x + 3, pos_y + 33);
			canvas.fillText(h, pos_x + 23, pos_y + 33);
			canvas.font = "14px Arial";
			canvas.fillText(g + h, pos_x + 3, pos_y + 15);
			break;
		case 6:
			canvas.fillStyle = COLOR_OBSTACLE;	
			canvas.fillRect(pos_x, pos_y, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP);
			break;
		case 7:
			canvas.fillStyle = COLOR_PURPLE;	
			canvas.fillRect(pos_x, pos_y, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP, BASIC_BLOCK_WIDTH - BASIC_BLOCK_GIP);
			break;
		default: 
			canvas.fillStyle = COLOR_BASIC;
	}
}
	

function drawGridBlock()
{
	canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	for (var i = 0; i < number_of_blocks_col; i++) 
	{
		for(var j = 0; j < number_of_blocks_row; j++)
		{
			_drawBasicBlock(j*BASIC_BLOCK_WIDTH, i*BASIC_BLOCK_WIDTH, arr[i][j].type, arr[i][j].g, arr[i][j].h);
		}
	}
}

function clk()
{
	if(mode == 0) // custom mode
	{
		switch(brushMode)
		{
			case 0: 
				drawGridBlock();
				_drawBasicBlock(curBlockX*BASIC_BLOCK_WIDTH, curBlockY*BASIC_BLOCK_WIDTH, 1);
				break;
			case 1:
				clearBlock();
				break;
			case 2:
				setStart();
				break;
			case 3:
				setEnd();
				break;
			case 4:
				setObstacle();
				break;
			default:
				drawGridBlock();
				_drawBasicBlock(curBlockX*BASIC_BLOCK_WIDTH, curBlockY*BASIC_BLOCK_WIDTH, 1);
		}		
	} 
	else // modify mode
	{
		_modifyCurNode();
	} 

	document.querySelector('#menu').style.width=0;
}

function clk_update()
{
	startX = -1;
	startY = -1;
	endX = -1;
	endY = -1;
	modX = -1;
	modY = -1;
	isModifyFinish = false;
	openList = [];
	closeList = [];
	obstacleList = [];
	mode = 0;
	modify.clearRect(0, 0, 200, 200);
	modify.fillText("MODIFY", 15, 25);
	document.getElementById('info').style.backgroundColor = "#f2f2f2";

	for(var i = 0; i < number_of_blocks_col; i++)
	{
		for(var j = 0; j < number_of_blocks_row; j++)
		{
			arr[i][j].type = 0;
		}
	}

	_showdetail();
	drawGridBlock();
	_drawBasicBlock(0*BASIC_BLOCK_WIDTH, 0*BASIC_BLOCK_WIDTH, 1);
	updateTip('Map refresh done.')
}

function clk_simulate()
{
	if(mode == 1)
	{
		updateTip('You can not simulate since it is in the modify mode currently, try in custom mode.');
		return;
	}

	if(startX < 0 || startY < 0 || endX < 0 || endY < 0)
	{
		updateTip('You have not set start point or end point. Check it please.');
		return;
	}
	var tempX = startX;
	var tempY = startY;
	updateTip('Simulation starts.');

	var interval = setInterval(function ()
	{
		if(tempX == endX && tempY == endY)
		{
			clearInterval(interval);
			arr[tempY][tempX].type = 3;
			updateTip('Simulation finished.')
		}
		else
		{
			if(tempX < endX)
			{
				tempX = tempX + 1;
			}
			else if(tempX > endX)
			{
				tempX = tempX - 1;
			}
			else if(tempY < endY)
			{
				tempY = tempY + 1;
			}
			else if(tempY > endY)
			{
				tempY = tempY - 1;
			}
			arr[tempY][tempX].type = 1;
		}
		drawGridBlock();
	}, 500);
}

function clk_showdetail()
{
	var detail = document.getElementById('detail');
	var csd = document.getElementById('csd');
	
	if(detail.style.display == "none")
	{
		detail.style.display = "block";
		csd.innerHTML = "HIDE DETAIL";
	}
	else 
	{
		csd.innerHTML = "SHOW DETAIL";
		detail.style.display = "none";
	}
}

function clk_modify()
{
	if(startX == -1 || startY == -1 || endX == -1 || endY == -1)
	{
		updateTip('You can not enter modify mode without setting the start point or end point.');
		return;
	}

	var temp_h = get_manhattan_distance(startX, startY, endX, endY);
	var temp_unit = new Unit(startX, startY, 0, temp_h, -1, -1);
	openList.push(temp_unit);

	if(mode == 0)
	{
		mode = 1;
		modify.clearRect(0, 0, 200, 200);
		modify.fillText("FINISH", 25, 25);
		document.getElementById('info').style.backgroundColor = "#63E91E";
		updateTip('Now in the modify mode, push unit: (' + startX + ',' + startY + ') into the openList');
	}
	else
	{
		mode = 0;
		openList = [];
		closeList = [];
		isModifyFinish = false;
		modify.clearRect(0, 0, 200, 200);
		modify.fillText("MODIFY", 15, 25);
		document.getElementById('info').style.backgroundColor = "#f2f2f2";
		updateTip('Now return to custom mode.');
	}
}

document.getElementById('can').onmousemove = function(e)
{
	var curX = window.event.pageX - (document.body.clientWidth - CANVAS_WIDTH ) / 2;
	var curY = window.event.pageY - 100;
	curBlockX = parseInt(curX / BASIC_BLOCK_WIDTH);
	curBlockY = parseInt(curY / BASIC_BLOCK_WIDTH);

	if(mode == 0)
	{
		var tempText = "You move to block (" + curBlockX + ', ' + curBlockY + ")";
		
		drawGridBlock();
		_drawBasicBlock(curBlockX*BASIC_BLOCK_WIDTH, curBlockY*BASIC_BLOCK_WIDTH, 1);

		updateTip(tempText);
		_showdetail();
	}
	else if(mode == 1)
	{
		var openList_pos = is_in_openList(curBlockX, curBlockY);
		var closeList_pos = is_in_closeList(curBlockX, curBlockY);
		var obstacleList_pos = is_in_obstacleList(curBlockX, curBlockY);
		if(openList_pos > -1)
		{
			document.getElementById('modify-message').style.left = (e.clientX + 10) + 'px';
			document.getElementById('modify-message').style.top = (e.clientY + 10) + 'px';
			document.getElementById('modify-message').style.display = 'block';
			document.getElementById('m-list-name').innerHTML = 'OPENLIST';
			document.getElementById('m-f').innerHTML = 'F:' + openList[openList_pos].f;
			document.getElementById('m-position').innerHTML = 'Position:(' + openList[openList_pos].x + ',' + openList[openList_pos].y + ')';
			document.getElementById('m-father').innerHTML = 'Father:(' + openList[openList_pos].fatherX + ',' + openList[openList_pos].fatherY + ')';
		}
		else if(closeList_pos > -1)
		{
			document.getElementById('modify-message').style.left = (e.clientX + 10) + 'px';
			document.getElementById('modify-message').style.top = (e.clientY + 10) + 'px';
			document.getElementById('modify-message').style.display = 'block';
			document.getElementById('m-list-name').innerHTML = 'CLOSELIST';
			document.getElementById('m-f').innerHTML = 'F:' + closeList[closeList_pos].f;
			document.getElementById('m-position').innerHTML = 'Position:(' + closeList[closeList_pos].x + ',' + closeList[closeList_pos].y + ')';
			document.getElementById('m-father').innerHTML = 'Father:(' + closeList[closeList_pos].fatherX + ',' + closeList[closeList_pos].fatherY + ')';
		}
		else if(obstacleList_pos > -1)
		{
			document.getElementById('modify-message').style.left = (e.clientX + 10) + 'px';
			document.getElementById('modify-message').style.top = (e.clientY + 10) + 'px';
			document.getElementById('modify-message').style.display = 'block';
			document.getElementById('m-list-name').innerHTML = 'OBSTACLELIST';
			document.getElementById('m-f').innerHTML = 'F:-';
			document.getElementById('m-position').innerHTML = 'Position:-';
			document.getElementById('m-father').innerHTML = 'Father:-';
		}
		else
		{
			document.getElementById('modify-message').style.display = 'none';
		}
	}
}

document.getElementById('can').oncontextmenu = function(e)
{
	e.preventDefault();
	var menu = document.querySelector("#menu");
	menu.style.left=e.clientX+'px';
	menu.style.top=e.clientY+'px';
	menu.style.width='180px';
}

function setStart()
{
	if(startX != -1)
	{
		arr[startY][startX].type = 0;
	}

	startX = curBlockX;
	startY = curBlockY;
	_showdetail();
	arr[curBlockY][curBlockX].type = 2;
	drawGridBlock();
	updateTip("Setting block(" + curBlockX + "," + curBlockY + ") as start point.");
}

document.getElementById('startPoint').onclick = function()
{
	setStart();
	document.querySelector('#menu').style.width=0;
}

function setEnd()
{
	if(endX != -1)
	{
		arr[endY][endX].type = 0;
	}

	endX = curBlockX;
	endY = curBlockY;
	_showdetail();
	arr[curBlockY][curBlockX].type = 3;
	drawGridBlock();
	updateTip("Setting block(" + curBlockX + "," + curBlockY + ") as end point.");
}

document.getElementById('endPoint').onclick = function()
{
	setEnd();
	document.querySelector('#menu').style.width=0;
}

document.getElementById('saveImg').onclick = function()
{
	var imgData = document.getElementById('can').toDataURL("image/png").replace("image/png", "image/octet-stream");;
	window.location.href = imgData;

	document.querySelector('#menu').style.width=0;
}

function clearBlock()
{
	arr[curBlockY][curBlockX].type = 0;

	if(curBlockX == startX && curBlockY == startY)
	{
		startX = -1;
		startY = -1;
	}

	if(curBlockX == endX && curBlockY == endY)
	{
		endX = -1;
		endY = -1;
	}

	var temp_pos = is_in_obstacleList(curBlockX, curBlockY);
	if(temp_pos != -1)
	{
		obstacleList.splice(temp_pos, 1);
	}

	_showdetail();
	drawGridBlock();
	updateTip("Clear block(" + curBlockX + "," + curBlockY + ").");
}

document.getElementById('clearBlock').onclick = function()
{
	clearBlock();	
	document.querySelector('#menu').style.width=0;
}

function setObstacle()
{
	arr[curBlockY][curBlockX].type = 6;

	if(curBlockX == startX && curBlockY == startY)
	{
		startX = -1;
		startY = -1;
	}

	if(curBlockX == endX && curBlockY == endY)
	{
		endX = -1;
		endY = -1;
	}

	_showdetail();
	var new_obstacle = {x: curBlockX, y: curBlockY};
	obstacleList.push(new_obstacle);

	drawGridBlock();
	updateTip("Setting block(" + curBlockX + "," + curBlockY + ") as obstacle.");
}

document.getElementById('obstacle').onclick = function()
{
	setObstacle();	
	document.querySelector('#menu').style.width=0;
}

function _showdetail()
{
	document.getElementById('sx').innerHTML = startX;
	document.getElementById('sy').innerHTML = startY;
	document.getElementById('ex').innerHTML = endX;
	document.getElementById('ey').innerHTML = endY;
	document.getElementById('cx').innerHTML = curBlockX;
	document.getElementById('cy').innerHTML = curBlockY;
	document.getElementById('mx').innerHTML = modX;
	document.getElementById('my').innerHTML = modY;
}

function clearToolUnitClassAttribute()
{
	document.getElementById('tool-pointer').setAttribute("class", "toolbar-unit");
	document.getElementById('tool-clear-block').setAttribute("class", "toolbar-unit");
	document.getElementById('tool-set-start').setAttribute("class", "toolbar-unit");
	document.getElementById('tool-set-end').setAttribute("class", "toolbar-unit");
	document.getElementById('tool-set-obstacle').setAttribute("class", "toolbar-unit");
}

// onclick functions of toolbar below.
document.getElementById('tool-pointer').onclick = function()
{
	clearToolUnitClassAttribute();
	document.getElementById('tool-pointer').setAttribute("class", "toolbar-unit tool-active");
	updateTip('Change brush to pointer.');
	brushMode = 0;
}

document.getElementById('tool-clear-block').onclick = function()
{
	clearToolUnitClassAttribute();
	document.getElementById('tool-clear-block').setAttribute("class", " toolbar-unit tool-active");
	updateTip('Change brush to clear block.');
	brushMode = 1;
}

document.getElementById('tool-set-start').onclick = function()
{
	clearToolUnitClassAttribute();
	document.getElementById('tool-set-start').setAttribute("class", "toolbar-unit tool-active");
	updateTip('Change brush to start block.');
	brushMode = 2;
}

document.getElementById('tool-set-end').onclick = function()
{
	clearToolUnitClassAttribute();
	document.getElementById('tool-set-end').setAttribute("class", "toolbar-unit tool-active");
	updateTip('Change brush to end block.');
	brushMode = 3;
}

document.getElementById('tool-set-obstacle').onclick = function()
{
	clearToolUnitClassAttribute();
	document.getElementById('tool-set-obstacle').setAttribute("class", "toolbar-unit tool-active");
	updateTip('Change brush to obstacle block.');
	brushMode = 4;
}

// functions about A* algorithms below.
function get_manhattan_distance(x1, y1, x2, y2)
{
	return 10 * (Math.abs(x1 - x2) + Math.abs(y1 - y2));
}

function get_min_in_openList()
{
	var min = 0;
	for(var i = openList.length - 1; i >= 0; i--)
	{
		if(openList[i].f < openList[min].f) min = i;
	}
	return min;
}

function is_in_openList(x, y)
{
	for(var i = 0; i < openList.length; i++)
	{
		if(x == openList[i].x && y == openList[i].y) return i;
	}
	return -1;
}

function is_in_closeList(x, y)
{
	for(var i = 0; i < closeList.length; i++)
	{
		if(x == closeList[i].x && y == closeList[i].y) return i;
	}
	return -1;
}

function is_in_obstacleList(x, y)
{
	for(var i = 0; i < obstacleList.length; i++)
	{
		if(x == obstacleList[i].x && y == obstacleList[i].y) return i;
	}
	return -1;
}

function drawGridBlock_bg()
{
	canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	for (var i = 0; i < number_of_blocks_col; i++) 
	{
		for(var j = 0; j < number_of_blocks_row; j++)
		{
			_drawBasicBlock(j*BASIC_BLOCK_WIDTH, i*BASIC_BLOCK_WIDTH, 0);
		}
	}
}

function drawBlock()
{
	for(var i = 0; i < openList.length; i++)
	{
		_drawBasicBlock(openList[i].x*BASIC_BLOCK_WIDTH, openList[i].y*BASIC_BLOCK_WIDTH, 5, openList[i].g, openList[i].h);
	}
	for(var i = 0; i < closeList.length; i++)
	{
		_drawBasicBlock(closeList[i].x*BASIC_BLOCK_WIDTH, closeList[i].y*BASIC_BLOCK_WIDTH, 4, closeList[i].g, closeList[i].h);
	}
	for(var i = 0; i < obstacleList.length; i++)
	{
		_drawBasicBlock(obstacleList[i].x*BASIC_BLOCK_WIDTH, obstacleList[i].y*BASIC_BLOCK_WIDTH, 6);	
	}

	_drawBasicBlock(endX*BASIC_BLOCK_WIDTH, endY*BASIC_BLOCK_WIDTH, 3);
	_drawBasicBlock(startX*BASIC_BLOCK_WIDTH, startY*BASIC_BLOCK_WIDTH, 2);
}

function get_fatherNode(x, y)
{
	for(var i = closeList.length - 1; i >= 0; i--)
	{
		if(x == closeList[i].x && y == closeList[i].y)
		{
			fatherX = closeList[i].fatherX;
			fatherY = closeList[i].fatherY;
			return {x: fatherX, y: fatherY};
		}
	}
	return {x: -1, y : -1};
}

// only need to find father point in the closeList.
function drawRoutine()
{
	var fatherX, fatherY;
	for(var i = openList.length - 1; i >= 0; i--)
	{
		if(endX == openList[i].x && endY == openList[i].y)
		{
			fatherX = openList[i].fatherX;
			fatherY = openList[i].fatherY;
		}
	}
	_drawBasicBlock(fatherX*BASIC_BLOCK_WIDTH, fatherY*BASIC_BLOCK_WIDTH, 7);
	while(fatherX != -1 && fatherY != -1)
	{
		var temp = get_fatherNode(fatherX, fatherY);
		fatherX = temp.x;
		fatherY = temp.y;
		_drawBasicBlock(fatherX*BASIC_BLOCK_WIDTH, fatherY*BASIC_BLOCK_WIDTH, 7);
	}
	_drawBasicBlock(startX*BASIC_BLOCK_WIDTH, startY*BASIC_BLOCK_WIDTH, 2);
}