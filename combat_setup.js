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
	$updateMenuHeroStats();
}

var pushYourDice = function(hero) {
	if (hero.stam > 0) {
		hero.turnTaken = false;
		hero.engagedThisTurn = false;
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

var theParty = [];
var theEnemyParty = [];

var establishEngagement = function(hero, enemy, disengage) {
	if (!hero.engagedThisTurn) {
		hero.engagedThisTurn = true;
		if (disengage) {
			hero.engaged = false;
			enemy.engagedTo = enemy.engagedTo.filter(function(element, index) {
				return element != hero;
			});
			if (enemy.moveset.hasOppo) {
				currentCombatMessage = enemy.moveset.oppoText;
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

var $engageHeroCard = function(hero) {
	if($('div#unengagedHeroes>div.hero>p').text() === hero.name) {
		$('div#unengagedHeroes>div.hero').addClass('engagedHero');
	}
}



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
			currentCombatMessage = 'Success! ' + hero.name + ' rolled a ' + 
			currentDiceResult.reduce(arrayAsSingleValue, 0) + '.';
			$printMessage(currentCombatMessage);

			currentTargetDamage = move.attack(currentTarget, currentWeapon, currentHero);
			dealDamage(currentTarget, currentTargetDamage);

			currentCombatMessage = currentTarget.name + ' was dealt ' + currentTargetDamage + ' damage!';
			messageDelay = 420;

			$updateTooltip('enemy', 'stam');

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

//when it's the enemy turn--
//go in enemyPartyOrder (represented left to right in the browser and 0-N in the array) 
//is the enemy engaged?
	//if not, then chargeUlt()
	//combat message because not engaged
	//CU checks to fireUlt()
	//print
	//combat message if ult fires
//if SO, enemy uses attack method on .engagedTo
	//combat message because engaged, print
	//combat message rollResult, print
	//deal damage using return value, if a number is returned
	//combat message damage dealt
	//update tooltips and menu
//print message

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
	$('#turnMarquee').text('PLAYER TURN');
	refreshDice(theParty);
};

var fireUlt = function(enemy) {
	currentCombatMessage = 'Ultimate attack!'
	$printMessage();
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

var promptForCP


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
	$('div#menuStam').text('Stamina: ' + hero.stam + '/' + hero.maxStam);
	$('div#menuDiceHeld').text('Dice Held: ' + hero.dice.length);
}

var $updateTooltip = function(unitType, stat) {
	var statName = stat.slice(0, 1).toUpperCase() + stat.slice(1)
	var className = '' + unitType + statName; 
	if (statName === 'Stam') {
		statName += 'ina';
	}
	$('div.ult').text('Ult in: ' + (theEnemyParty[0].moveset.ultFiresOn - theEnemyParty[0].ultCharge));
	$('div.' + className).text(statName + ': ' + theEnemyParty[0][stat] + '/' + theEnemyParty[0].maxStam);
	$('div.enemyBreak:first').text('Break Dice: ' + theEnemyParty[0].breakDiceCurrent); 
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


var $disengageHeroCard = function(hero) {
	if($('div#unengagedHeroes>div.hero>p').text() === hero.name) {
		$('div#unengagedHeroes>div.hero').removeClass('engagedHero');
	}
}

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
			if (enemy.stam > 0) {
				enemy.turnTaken = false;
				enemy.broken = false;
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
}