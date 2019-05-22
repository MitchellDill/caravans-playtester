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
	} else {
		pushYourDice(heroOrParty);
	}
}

var pushYourDice = function(hero) {
	hero.diceStrength.forEach(function(die) {
		hero.dice.push(die);
	});
};	


//the engagement model and options
//enemies will now keep track of the heroes they engage with in an array

var theParty = [];
var theEnemyParty = [];

var establishEngagement = function(hero, enemy, disengage) {
	if (disengage) {
		hero.engaged = false;
		enemy.engagedTo = enemy.engagedTo.filter(function(element, index) {
			return (!hero);
		});
		//trigger attack of opportunity
	} else {
		hero.engaged = true;
		enemy.engaged = true;
		enemy.engagedTo.push(hero);
	}
};



//attack flow functions

//choose move

var currentMove;
var currentHero;
var currentTarget;
var currentWeapon;
var currentTargetDamage;
var currentDice = [];
var currentDiceResult;
var currentCombatMessage;
var currentMoveText;

var messageDelay;


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
			currentCombatMessage = 'Success! ' + hero.name + ' rolled a ' + 
			currentDiceResult.reduce(arrayAsSingleValue) + '.';
			$printMessage(currentCombatMessage);

			currentTargetDamage = move.attack(currentTarget, currentWeapon, currentHero);
			dealDamage(currentTarget, currentTargetDamage);

			currentCombatMessage = currentTarget.name + ' was dealt ' + currentTargetDamage + ' damage!';
			messageDelay = 420;

			$updateTooltip('enemy', 'stam');

		} else {
			currentCombatMessage = 'Failure! ' + hero.name + ' rolled a ' + 
			currentDiceResult.reduce(arrayAsSingleValue, 0) + '!';
			return false;
		}


	}

//	if (currentMove.hero) {

//	}	

//	if (currentMove.extra) {

//	}
	return true;
};


var dealDamage = function(target, damage) {
	if (target.guard > 0) {
		damage -= target.guard;
	}
	if (target.armor > 0) {
		damage -= target.armor;
	}
	currentTargetDamage = damage;
	target.stam -= damage;
	return target.stam;
};


var rollDiceIntoArray = function(diceArr) {
	var arr = [];
	for (var i = 0; i < diceArr.length; i++) {
		arr.push(diceArr[i].roll());
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
		return false;
				}
	if (currentTarget.broken) {
		currentCombatMessage = currentTarget.name + ' is already broken.'; 
	} else {
		//currentDice = hero.dice;
		currentDiceResult = rollDiceIntoArray(currentDice);
		currentCombatMessage = hero.name + ' rolled ' + currentDiceResult + ' as break dice onto ' + currentTarget.name + '.';
		$printMessage(currentCombatMessage);
		
		addBreak(hero, currentTarget, currentDiceResult);

		//currentDice, hero.dice = [];
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
			hero.turnTaken = false;
		}
	});
	brokenEnemy.breakDiceCurrent = [];
};


//dice choice and submission

var $chooseDice = function() {
	$('div#heroOptionsWindow3').remove();
	$('div#menu').append('<div id="heroOptionsWindow3"><p>How many Dice?</p></div>');
	$('div#heroOptionsWindow3').append('<div><form id="diceChosen"></form></div>');
	$genDiceForm(currentHero);
};

var $genDiceForm = function(hero) {
	var str = '<form id="diceChosen">';
	for (var i = 0; i < hero.dice.length; i++) {
		str += ('<input type="checkbox" name="dice' + i + '" value="' + 
		hero.dice[i].name + '">' + hero.dice[i].name + '<br>'); 
	};
	str += '</form>';
	$('form#diceChosen').html(str);
	$('form#diceChosen').append('<input id= "diceChosenSubmit" class="button" type="button" value="submit" ' + 
		' />Roll!');
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


//combat feed print

var $printMessage = function(message) {
	$('div#feed').prepend('<p class="message">' + currentCombatMessage + '</p>');
	if (currentCombatMessage.includes('damage') && currentTargetDamage > 0) {
		$('div#feed>p.message:first').addClass('damage');
	}
};



// combat cleanup functions follow


var $updateTooltipHeroDice = function(hero) {
	$('div#menuDiceHeld').text('Dice Held: ' + hero.dice.length);
}

var $updateTooltip = function(unitType, stat) {
	var statName = stat.slice(0, 1).toUpperCase() + stat.slice(1)
	var className = '' + unitType + statName; 
	if (statName === 'Stam') {
		statName += 'ina';
	}
	$('div.' + className).text(statName + ': ' + theEnemyParty[0][stat] + '/' + theEnemyParty[0].maxStam);
	$('div.enemyBreak:first').text('Break Dice: ' + theEnemyParty[0].breakDiceCurrent); 
};


var $updateMenuHeroStats = function() {
	$('div#heroStam>p').text('Stamina: ' + currentHero.stam + '/' + currentHero.maxStam);
	genStamMeter(currentHero);
	$('div#heroCP>p:nth-child(2)').text(currentHero.cp);
	$('div#heroGuard>p:nth-child(2)').text(currentHero.guard);
	$('div#heroArmor>p:nth-child(2)').text(currentHero.armor);
	$('#heroDice>p').text(currentHero.dice.length + ' dice available');
};

var emptyDice= function() {
	currentDice = [];
};
