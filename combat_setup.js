//global variables

var currentMove;
var currentHero;
var currentEnemy;
var currentTarget;
var currentWeapon;
var currentTargetDamage;
var currentDice = [];
var currentDiceResult;
var currentCombatMessage;
var currentMoveText;

var messageDelay;

var theParty = [];
var theEnemyParty = [];

//character menu generation functions

var genEngageOption = function(hero) {
	if (hero.engaged) {
		return 'Disengage!';
	} else {
		return 'Engage!';
	}
};

var mapNameProp = function(arrOrObj, keyword) {
	if (Array.isArray(arrOrObj)) {
		return arrOrObj.map(function(element) {
			return element.name;
		});
	} else {
		var arr = [];
		for (var prop in arrOrObj) {
			if (prop.includes(keyword)) {
				arr.push(arrOrObj[prop].name)
			} else if (Array.isArray(arrOrObj[prop])) {
				arr = arr.concat(mapNameProp(arrOrObj[prop], keyword));
			}
		};
		return arr;
	}
};

var runOnArray = function(arr, callback, parameter) {
	//returns an array
	var returnArr = [];
	for (var i = 0; i < arr.length; i++) {
		returnArr = returnArr.concat(callback(arr[i], parameter));
	};
	return returnArr;
};

var $genMenu = function(div, arr, option) {
	arr.forEach(function(element) {
		div.append('<div class="option ' + option + '"><p class="' + option + '">' + element + '</p></div>')
	});
	$('#heroOptionsWindow3').remove();
};

var $genToolTip = function(div, arr, option) {
	arr.forEach(function(element, index) {
		div.append('<div class = "' + option + index + '">' + element + '</div>')
	});
};

var genStamMeter = function(hero) {
	$('div#heroStam>meter').attr('max', hero.maxStam)
		.attr('min', 0)
		.attr('high', Math.floor(hero.maxStam * 0.8))
		.attr('low', Math.floor(hero.maxStam * 0.2))
		.attr('optimum', (hero.maxStam - 1))
		.attr('value', hero.stam);
};

//combat setup

var populateBreakObjectWithEnemies = function() {
	theParty.forEach(function(hero) {
		theEnemyParty.forEach(function(enemy) {
			var enemyName = enemy.name;
			hero.breakDiceOn[enemyName] = [];
		});
	})
};

var refreshDice = function(heroOrParty) {
	if (Array.isArray(heroOrParty)) {
		heroOrParty.forEach(pushYourDice)
		if (theParty.filter(function(hero){return hero.stam > 0})
			.every(function(alive){return !alive.turnTaken})) {
			$('div#turnMarquee').text('PLAYER TURN');
		}
	} else {
		pushYourDice(heroOrParty);
	}
	$updateMenuHeroStats();
}

var pushYourDice = function(hero) {
	if (hero.stam > 0) {
		hero.turnTaken = false;
		hero.engagedThisTurn = false;
		if (theEnemyParty.every(function(enemy) {return !enemy.broken;})) {
			hero.gainedCP = false;
		}
		hero.diceStrength.forEach(function(die) {
			if (hero.dice.length != hero.diceStrength.length) {
				hero.dice.push(die);
			}
		});
		$updateTooltipHeroDice(hero);
	}
};	


//the engagement model and options
//enemies will now keep track of the heroes they engage with in an array

var establishEngagement = function(hero, enemy, disengage) {
	if (!hero.engagedThisTurn) {
		hero.engagedThisTurn = true;
		if (disengage) {
			hero.engaged = false;
			enemy.engagedTo = enemy.engagedTo.filter(function(element, index) {
				return element != hero;
			});
			if (enemy.moveset.hasOppo) {
				$printMessage(enemy.moveset.oppoText);
				currentTargetDamage = enemy.moveset.oppo.call(enemy);
				if (typeof currentTargetDamage === 'number') {
					dealDamage(hero, currentTargetDamage);
				}
			}
			if (enemy.engagedTo.length === 0) {
				enemy.engaged = false;
				return true;
			}
		} else {
			hero.engaged = true;
			enemy.engaged = true;
			enemy.engagedTo.push(hero);
			return true;
		}
	} else {
		currentCombatMessage = 'You can\'t engage or disengage both in a single turn, partner.';
		return false;
	}
};

var $engageHeroCard = function(hero, enemy) {
	$cleanUpCards(hero, 'hero', '#unengagedHeroes');
	$cleanUpCards(enemy, 'enemy', '#unengagedEnemies');

	if (!$('div#engagedEnemies').hasClass(enemy.name)) {
		$setupEngagementDiv(hero, enemy);
	} else {
		$generateHeroCard(hero, 'div.' + enemy.name + '>div.engagingHeroes');
	}
	$('div.' + enemy.name + '>div.engagingHeroes').css('width', (120 * enemy.engagedTo.length));
	$('div.enemyZone.' + enemy.name).css('width', (132 * enemy.engagedTo.length));
};

var $disengageHeroCard = function(hero) {
	$cleanUpCards(hero, 'hero', '.enemyZone>div.engagingHeroes');
	
	$generateHeroCard(hero, 'div#unengagedHeroes')
	var enemy = returnEngagedEnemy(hero);
	hero.$disengageEnemy(enemy);

	$('div.' + enemy.name + '>div.engagingHeroes').css('width', (120 * enemy.engagedTo.length));
	$('div.enemyZone.' + enemy.name).css('width', (132 * enemy.engagedTo.length));

	if (enemy.engagedTo.length === 0) {
		$cleanUpCards(enemy, 'enemy', '.enemyZone');
		$('div.enemyZone.' + enemy.name).remove();
		$generateEnemyCard(enemy, 'div#unengagedEnemies')
	}
};

var $childNodeCleanup = function() {
	for (var i = this.childNodes.length - 1; i >= 0; i--) {
		$(this.childNodes[i]).remove();
	};
};

//enemy engagement zone setup

var $generateEnemyCard = function(enemy, div) {
	var enemyID = enemy.ID();
	$(div).prepend('<div class="enemy" id="' + enemyID + '"><p>' + enemy.name + '</p></div>');
	var $card = $('div#' + enemyID);
	$card.append('<div class="cardStats">' +
		'<div class="enemyStam">Stamina: ' + enemy.stam + '/' + enemy.maxStam + '</div>' +
    	'<div class="ult">Ult in: ' + (enemy.moveset.ultFiresOn - enemy.ultCharge) + '</div>' + 
    	'<div class="enemyBreak">Break now: ' + enemy.breakDiceCurrent.reduce(arrayAsSingleValue, 0) + '</div>' + 
    	'<div class="enemyBreak">Breaks at: ' + enemy.breakThresh + '</div>' +
		'</div>');

	//enemy tooltip gen
    $('#' + enemyID).append('<div class="statWindow menuInfoHover">' + 
    	'<div class="enemyBreak">Break Dice: [' + enemy.breakDiceCurrent + ']</div>' + 
    	'<div class="enemyMoveset"><p><span>Basic:</span> ' + enemy.moveset.basicText + '</p>' +
    	'<p><span>Specialized:</span> ' + enemy.moveset.specializedText + '</p>' + 
    	'<p><span>Advanced:</span> ' + enemy.moveset.advancedText + '</p>' +
    	'<p><span>Ultimate:</span> ' + enemy.moveset.ultimateText + '</p></div>');
    if (enemy.moveset.hasOppo) {
    	$('#' + enemyID + '>div.statWindow>div.enemyMoveset')
    	.append('<p><span>Attack of Opportunity:</span> ' + enemy.moveset.oppoText + '</p>');
    }
}

var $generateHeroCard = function(hero, div) {
	var heroID = hero.ID();
	$(div).append('<div class="hero" id="' + heroID + '"><p>' + hero.name + '</p></div');
	var $card = $('div#' + heroID);
	$card.append('<div class="cardStats">' + 
		'<div class="menuStam">Stamina: ' + hero.stam + '/' + hero.maxStam + '</div>' +
    	'<div class="menuDiceHeld">Dice Held: ' + hero.dice.length + '</div>' + 
		'</div>');
	if (hero.guard> 0) {
		$('div #' + heroID + '>div.cardStats').append('<div class="guard">Guard: ' + hero.guard + '</div>');
	}
	if (hero.armor > 0) {
		$('div #' + heroID + '>div.cardStats').append('<div class="armor">Armor: ' + hero.armor + '</div>');
	}

	  //hero tooltip gen
	  	$card.append('<div class="statWindow"></div>')
	  	var $selectedDiv = $('div#' + heroID + '>div.statWindow');
	  	$genToolTip($selectedDiv, mapNameProp(hero.inventory.equipped), 'weapon');
	  	for (var i = 0; i < hero.inventory.equipped.length; i++) {
	  		$('div#' + heroID + '>div.statWindow>div.weapon' + i).append('<div class="statWindow2"></div>');
	  		var $nestedToolTip = $('div#' + heroID + ' .statWindow2')
	  		$genToolTip($nestedToolTip, mapNameProp(hero.inventory.equipped[i], 'move'), 'move');
	  	};
	  	for (var en in hero.breakDiceOn) {
	  		if (hero.breakDiceOn[en].length > 0) {
	  			$selectedDiv.append('<div class="heroBreak">Break dice #:<br>' + en + ' - ' + 
	  				hero.breakDiceOn[en].length + '</div>');
	  		}
	  	};
	  	
	  	
/*
	  	hero.inventory.equipped[0].name
    	$('#' + heroID).append('<div class="statWindow">' + 
    		'<div class="wielding">Wielding: ' + hero.inventory.equipped[0].name + '</div>')
    		.append('<div class="statWindow">' +
    			'<div>' +  '</div>'
    			)
    			*/
}
    		
var $setupEngagementDiv = function(hero, enemy) {
		$('div#engagedEnemies').append('<div class="enemyZone ' + enemy.name + '"><div class="engagingHeroes"></div></div>');
		$generateEnemyCard(enemy, 'div.' + enemy.name);
		$generateHeroCard(hero, 'div.engagingHeroes');
};

var $cleanUpCards = function(unit, type, zoneWithPunctuation) {
	var oldCard = document.getElementById(unit.ID());		
	$childNodeCleanup.call(oldCard);
	$('div' + zoneWithPunctuation + '>div.' + type).remove();
};
//attack flow functions

//choose move

var findEquippedWeaponWithMove = function(moveName, currentHero) {
	var currentEquip = currentHero.inventory.equipped;
	for (var i = 0; i < currentEquip.length; i++) {
		if (findWhichMoveWithName(moveName, currentEquip[i]).name === moveName) {
			return currentEquip[i];
		}
	};
};

var findWhichMoveWithName = function(moveName, weapon) {
	for (var moves in weapon) {
		if (weapon[moves].name === moveName) {
			return weapon[moves];
		}
	};
};


var returnEngagedEnemy = function(hero) {
	for (var engagedEnemy in theEnemyParty) {
		var engagements = theEnemyParty[engagedEnemy].engagedTo;
		for (var i = 0; i < engagements.length; i++) {
			if (engagements[i] === hero) {
				return theEnemyParty[engagedEnemy];
			}
		};
	};
	return null;
};




var chooseMove = function(move, hero) {
	messageDelay = 0;
	if (move.enemy) {
		if (!move.ranged) {
			currentTarget = returnEngagedEnemy(hero);
				if (currentTarget === null) {
					currentCombatMessage = 'You must first engage in melee combat to use ' + 
					move.name + '.';
					refundDice(currentHero);
					return false;
				}
		} else if (move.ranged) {
			currentTarget;
		}
		//select which dice to roll
		currentDiceResult = rollDiceIntoArray(currentDice);

		$('#heroOptionsWindow2').html('');
		$('#heroOptionsWindow3').remove(); 
		$updateTooltipHeroDice(hero);
		
		if (hero.checkRoll(move, currentDiceResult)) {
			attackSuccessfully(hero, move);
			
		} else if (hero.cp > 0) {
			if (hero.checkRoll(move, currentDiceResult, true)) {
				var cpSpent = promptForCP(currentDiceResult, move);
				if (cpSpent > hero.cp) {
					cpSpent = hero.cp;
				}
				if (cpSpent > 0) {
					hero.cp -= cpSpent;
					hero.rollBonus = cpSpent;
					if (hero.checkRoll(move, currentDiceResult)) {
						currentDiceResult.push(cpSpent);
						hero.gainedCP = true;
						attackSuccessfully(hero, move);
						hero.gainedCP = false;
					} else {
						$printMessage('Wasn\'t enough CP to do the trick, friend.');
						hero.cp +- cpSpent;
						return false
					}
				} else {
					currentCombatMessage = 'Failure! ' + hero.name + ' rolled a ' + 
					currentDiceResult.reduce(arrayAsSingleValue, 0) + '!';
					return false;
				}
			} else {
				currentCombatMessage = 'Failure! ' + hero.name + ' rolled a ' + 
				currentDiceResult.reduce(arrayAsSingleValue, 0) + '!';	
			}
		} else {
			if (currentDice.length > 0) {
				currentCombatMessage = 'Failure! ' + hero.name + ' rolled a ' + 
				currentDiceResult.reduce(arrayAsSingleValue, 0) + '!';
			} else {
				currentCombatMessage = 'Looks like ' + hero.name + ' is out of dice.';
			}
			return false;
		}

	}

//	if (currentMove.hero) {

//	}	

//	if (currentMove.extra) {

//	}
	return true;
};

var attackSuccessfully = function(hero, move) {
	currentCombatMessage = 'Success! ' + hero.name + ' rolled a ' + currentDiceResult.reduce(arrayAsSingleValue, 0) + '.';
	$printMessage(currentCombatMessage);

	currentTargetDamage = move.attack(currentTarget, currentWeapon, currentHero);
	dealDamage(currentTarget, currentTargetDamage);

	currentCombatMessage = currentTarget.name + ' was dealt ' + currentTargetDamage + ' damage!';
	messageDelay = 420;

	$updateTooltip('enemy', 'stam');
};


var dealDamage = function(target, damage) {
	if (target.guard > 0) {
		damage -= target.guard;
		target.guard -= damage;
	}
	if (target.armor > 0) {
		damage -= target.armor;
		target.armor -= damage;
	}
	currentTargetDamage = damage;
	target.stam -= damage;
	if (target.armor < 0) {
		target.armor = 0;
	}
	if (target.guard < 0) {
		target.guard = 0;
	}
	return target.stam;
};


var rollDiceIntoArray = function(diceArr) {
	var arr = [];
	for (var i = 0; i < diceArr.length; i++) {
		if (diceArr[i] != undefined) {
			arr.push(diceArr[i].roll());
		}
	};
	return arr;
};

var arrayAsSingleValue = function(accum, current) {
	return accum + current;
};


//break stuff


var chooseBreak = function(hero) {

	messageDelay = 0;
	currentTarget = returnEngagedEnemy(hero);
	if (currentTarget === null) {
		currentCombatMessage = 'You must first engage in melee combat to use break.';
		refundDice(currentHero);
		return false;
	}
	if (currentTarget.broken) {
		currentCombatMessage = currentTarget.name + ' is already broken.'; 
	} else if (currentDice.length > 0) {
		currentDiceResult = rollDiceIntoArray(currentDice);
		currentCombatMessage = hero.name + ' rolled ' + currentDiceResult + ' as break dice onto ' + currentTarget.name + '.';
		$printMessage();
		addBreak(hero, currentTarget, currentDiceResult);
		messageDelay = 420;
	}

	$updateTooltipHeroDice(hero);
	$updateTooltip('enemy', 'stam');
	$('#heroOptionsWindow2').html('');
	$('#heroOptionsWindow3').remove(); 
};

var addBreak = function(hero, target, breakDiceResult) {
	currentTargetDamage = breakDiceResult;
	var targetName = target.name
	currentDice.forEach(function(die) {
		hero.breakDiceOn[targetName].push(die);
	});
	breakDiceResult.forEach(function(die) {
		target.breakDiceCurrent.push(die);
		currentCombatMessage = target.name + ' is ' + 
			(target.breakThresh - target.breakDiceTotal()) + ' away from breaking.';
	});
	if (target.breakDiceTotal() >= target.breakThresh) {
		target.broken = true;
		currentCombatMessage = 'Break!';
		InitiateBreak(target);
	}
};

var InitiateBreak = function(brokenEnemy) {
	var enemyName = brokenEnemy.name;
	theParty.forEach(function(hero) {
		if (hero.breakDiceOn[enemyName]) {
			refreshDice(hero);
			hero.breakDiceOn[enemyName].forEach(function(die) {
				hero.dice.push(die);
				
			});
			hero.breakDiceOn[enemyName] = [];
		}
	});
	brokenEnemy.breakDiceCurrent = [];
};


//enemy attacking

var enemyPartyAttacks = function(enemiesArr) {
	messageDelay = 0;
	var activeEnemy;
	for (var i = 0; i < enemiesArr.length; i++) {
		activeEnemy = enemiesArr[i];
		if (!activeEnemy.turnTaken) {
			currentEnemy = activeEnemy;
			if (!activeEnemy.engaged) {
				activeEnemy.chargeUlt();
				setTimeout($printMessage, 600);
			} else if (activeEnemy.engaged) {
				currentTarget = activeEnemy.engagedTo;
				var enemyAttack = activeEnemy.attack(currentTarget);
				if (typeof enemyAttack === 'number') {
					var attackedHero;
					for (var j = 0; j < activeEnemy.engagedTo.length; j++) {
						attackedHero = activeEnemy.engagedTo[j];
						dealDamage(attackedHero, enemyAttack);
						currentCombatMessage = activeEnemy.name + ' dealt ' + enemyAttack
							 + ' damage to ' + attackedHero.name + '.';
						attackedHero.getStatus();
						setTimeout($printMessage, 800);
					}
				} else {
					setTimeout($printMessage, 550);
				}
			}
			activeEnemy.turnTaken = true;
			$updateTooltip('enemy', 'stam');
			$updateTooltipHeroDice(currentHero);
			$updateMenuHeroStats();
		}
	};
	refreshDice(theParty);
};

var fireUlt = function(enemy) {
	$printMessage('Ultimate attack!');
	enemy.moveset.ultimate();
	enemy.ultCharge = 0;
	
	currentCombatMessage = enemy.name + '\'s ult charge resets to 0.';
};



//dice choice and submission

var $chooseDice = function() {
	$('div#heroOptionsWindow3').remove();
	$('div#menu').append('<div id="heroOptionsWindow3"><p>Roll which dice?</p></div>');
	$('div#heroOptionsWindow3').append('<div><form id="diceChosen"></form></div>');
	$genDiceForm(currentHero);
};

var $genDiceForm = function(hero) {
	var str = '<form id="diceChosen">';
	for (var i = 0; i < hero.dice.length; i++) {
		str += ('<input type="checkbox" name="dice' + i + '" value="' + 
		hero.dice[i].name + '">' + hero.dice[i].name + ' (' + hero.dice[i].sides + ')<br>'); 
	};
	str += '</form>';
	$('form#diceChosen').html(str);
	$('form#diceChosen').append('<input id="diceChosenSubmit" class="button" type="button" value="Roll!" ' + 
		' />');
};

var setCurrentDice = function() {
	var form = document.getElementById('diceChosen');
	var	diceCheckArr = currentHero.dice.slice(0).map(function(element, index) {
		var diceName = 'dice' + index;
		if (returnCheckBox(form.elements[diceName])) {
			if (element.name === form.elements[diceName].value) {
				currentDice[index] = element;
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}		
	});
	currentHero.dice = currentHero.dice.filter(function(element, index) {
		return (diceCheckArr[index]) ? false : true;
	});
	if (currentMove === 'move') {
		$clickSubmitMove();
	} else if (currentMove === 'break') {
		$clickSubmitBreak();
	}
};

var refundDice = function(hero) {
	currentDice.forEach(function(die) {
		hero.dice.push(die);
	});
};

var returnCheckBox = function(checkbox) {
	if (checkbox.checked) {
		return true;
	} else {
		return false;
	}
};

var $clickSubmitMove = function() {
	currentWeapon = findEquippedWeaponWithMove(currentMoveText, currentHero);
	currentMove = findWhichMoveWithName(currentMoveText, currentWeapon);
	currentHero.askCP(chooseMove(currentMove, currentHero));
	setTimeout('$printMessage()', messageDelay);
	$updateMenuHeroStats();
	emptyDice();
};


var $clickSubmitBreak = function() {
	chooseBreak(currentHero);
	setTimeout('$printMessage()', messageDelay);
	$updateMenuHeroStats();
	emptyDice();
};

//CP handling

//need to implement!

var promptForCP = function(rollResult, move) {
	return Number(prompt('You rolled [' + rollResult + '] and you need ' + move.cost + ' total... Would you like to spend CP?', '0'));
};

//if roll is false, hero has CP, and CP amount could lead to a pass
//show roll result
//allow player to input number of CP to spend which would make it a pass
//add CP to roll bonus



//combat feed print

var $printMessage = function(message) {
	if (!message) {
		message = currentCombatMessage;
	}
	$('div#feed').prepend('<p class="message">' + message + '</p>');
	if (message.includes('damage')) {
		$('div#feed>p.message:first').addClass('damage');
	}
};



// combat cleanup functions follow


var $updateTooltipHeroDice = function(hero) {
	var heroID = hero.ID();
	var $heroCard = 'div#' + heroID + '>div.cardStats>';
	$($heroCard + '.menuStam').text('Stamina: ' + hero.stam + '/' + hero.maxStam);
	$($heroCard + '.menuDiceHeld').text('Dice Held: ' + hero.dice.length);
}

var $updateTooltip = function(unitType, stat) {
	var statName = stat.slice(0, 1).toUpperCase() + stat.slice(1)
	var className = '' + unitType + statName; 
	if (statName === 'Stam') {
		statName += 'ina';
	}
	$('.ult').text('Ult in: ' + (theEnemyParty[0].moveset.ultFiresOn - theEnemyParty[0].ultCharge));
	$('.' + className).text(statName + ': ' + theEnemyParty[0][stat] + '/' + theEnemyParty[0].maxStam);
	$('.enemyBreak:first').text('Break Now: ' + theEnemyParty[0].breakDiceCurrent.reduce(arrayAsSingleValue, 0));
	$('.statWindow>div.enemyBreak').text('Break Dice: [' + theEnemyParty[0].breakDiceCurrent + ']');
};


var $updateMenuHeroStats = function() {
	$('div#heroStam>p').text('Stamina: ' + currentHero.stam + '/' + currentHero.maxStam);
	genStamMeter(currentHero);
	$('div#heroCP>p>span').text(currentHero.cp);
	$('div#heroGuard>p>span').text(currentHero.guard);
	$('div#heroArmor>p>span').text(currentHero.armor);
	$('div#heroStatus>p>span').text(currentHero.getStatus());
	$('#heroDice>p').text(currentHero.dice.length + ' dice available');
};


var emptyDice= function() {
	currentDice = [];
	if (currentHero.dice.length <= 0) {
		currentHero.turnTaken = true;
		triggerEndOfTurn();
	}
};


//keeping track of TURNS


var triggerEndOfTurn = function() {
	if (theParty.every(function(unit) {return unit.turnTaken;})) {
		theEnemyParty.forEach(function(enemy) {
			enemy.broken = false;
			if (enemy.stam > 0) {
				enemy.turnTaken = false;
			}
		});
		$('div#turnMarquee').delay(700).text('ENEMY TURN');
		setTimeout(function() {
			$printMessage('The heroes\' turn is over...');
			setTimeout(function() {
				enemyPartyAttacks(theEnemyParty);
			}, 800);
		}, 750);
	}
};

var passTurnManual = function() {
	currentHero.turnTaken = true;
	$updateMenuHeroStats();
	$updateTooltipHeroDice(currentHero);
	triggerEndOfTurn();
};