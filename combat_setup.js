//character menu generation functions

var genEngageOption = function(hero) {
	if (hero.engaged) {
		return 'Disengage!';
	} else {
		return 'Engage!';
	}
};

var genStamMeter = function(hero) {
	$('div#heroStam>meter').attr('max', hero.maxStam)
		.attr('min', 0)
		.attr('high', Math.floor(hero.maxStam * 0.8))
		.attr('low', Math.floor(hero.maxStam * 0.2))
		.attr('optimum', (hero.maxStam - 1))
		.attr('value', hero.stam);
};

//attack flow functions

//choose move

var currentMove;
var currentHero;
var currentTarget;
var currentWeapon;
var currentTargetDamage;
var currentDice;
var currentDiceResult;
var currentCombatMessage;

/*
var findWeaponWithMove = function(move, hero) {
	for (var i = 0; i < hero.inventory.equipped.length; i++) {
		if (hero.inventory.equipped[i][move]) {
			return hero.inventory.equipped[i];
		}
	};
};
*/

//need to access all actual moves above, doesn't access correct property level

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
};

//need to address below function so that it grabs correct parts of move object--hard to do in console



var chooseMove = function(move, hero) {
	if (move.enemy) {
		if (!move.ranged) {
			currentTarget = returnEngagedEnemy(hero);
		} else if (move.ranged) {
			currentTarget;
		}
		//select which dice to roll
		currentDice = hero.dice;
		//set currentDice = selectedDice
		currentDiceResult = rollDiceIntoArray(currentDice);
		currentDice = [];
		$('div#menuDiceHeld').text('Dice Held: ' + hero.dice.length);
		
		if (hero.checkRoll(move, currentDiceResult)) {
			currentCombatMessage = 'Success! ' + hero.name + ' rolled a ' + 
			currentDiceResult.reduce(arrayAsSingleValue) + '!';
			currentTargetDamage = move.attack(currentTarget, currentWeapon, currentHero);
			dealDamage(currentTarget, currentTargetDamage);
			$updateTooltip('enemy', 'stam');
		} else {
			currentCombatMessage = 'Failure! ' + hero.name + ' rolled a ' + 
			currentDiceResult.reduce(arrayAsSingleValue) + '!';
			return false;
		}

		//if (hero.checkDice(move, diceResult))
		//print diceResult
		//set dice avail
		
		//else print diceResult + fail 
		//set dice avail
		//end


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



// combat cleanup functions follow


var $updateTooltip = function(unitType, stat) {
	var className = '' + unitType + stat.slice(0, 1).toUpperCase() + stat.slice(1); 
	$('div.' + className).text(stat + ': ' + theEnemyParty[0].stam + '/' + theEnemyParty[0].maxStam);
};