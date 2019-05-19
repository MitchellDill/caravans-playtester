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

var returnEngagedEnemy = function(hero) {
	for (var engagedEnemy in currentEngagements) {
		for (var i = 0; i < engagedEnemy.length; i++) {
				if (engagedEnemy[i].name === hero.name) {
					return engagedEnemy;
				}
		};
	};
};

//need to address below function so that it grabs correct parts of move object--hard to do in console

var chooseMove = function(move, hero) {
	currentWeapon = hero.inventory.equipped[0];
	//currentWeapon = findWeaponWithMove(move, hero);
	currentMove = currentWeapon[move];
	if (currentMove.enemy) {
		if (!currentMove.ranged) {
			currentTarget = returnEngagedEnemy(hero);
		} else if (currentMove.ranged) {
			currentTarget;
		}
		//select which dice to roll
		currentDice = hero.dice;
		//set currentDice = selectedDice
		currentDiceResult = rollDiceIntoArray(diceArr);
		currentDice = [];
		$('div#menuDiceHeld').text('Dice Held: ' + hero1.dice.length);
		
		if (hero.checkDice(move, currentDiceResult)) {
			currentCombatMessage = 'Success! ' + hero.name + ' rolled a ' + 
			currentDiceResult.reduce(arrayAsSingleValue) + '!';
			currentTargetDamage = currentMove.attack(currentTarget, currentWeapon, currentHero);
			dealDamage(currentTarget, currentTargetDamage);
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

	if (currentMove.hero) {

	}	

	if (currentMove.extra) {

	}
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