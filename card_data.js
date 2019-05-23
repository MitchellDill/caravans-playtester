
//dice

var Dice = function() {
	this.sides = [];
	for (var i = 0; i < arguments.length; i++) {
		this.sides.push(arguments[i]);
	};
};

Dice.prototype.roll = function() {
	return this.sides[Math.floor(Math.random() * this.sides.length)];
}

var startDice = new Dice(0, 1, 2);
startDice.name = "Starter Die";
var midDice = new Dice(0, 1, 1, 2, 2, 3);
midDice.name = "Mid Die";
var endDice = new Dice(1, 2, 3);
endDice.name = "Endgame Die";
var enemyDice = new Dice('basic', 'basic', 'basic', 'specialized', 'specialized', 'advanced');
enemyDice.name = "Enemy Die";
var ultDice = new Dice(0, 1, 1, 1, 1, 2);
ultDice.name = "Ult Die";
var sixDice = new Dice(1, 2, 3, 4, 5, 6);
sixDice.name = "Six-sided Die";



//traits

var allTraits = {
	'hardy' : {
		name : 'Hardy',
		available : false,
		inCombat : false,
		inTown : false,
		inTravel : false,
		inGen : true,
		effGen : function() {
			this.stam += 2;
			this.maxStam += 2;
		} 
	}
};



//hero cards
var allHeroes = [];

var Hero = function(name, stam, trait) {
	this.name = name;
	this.trait = allTraits[trait];
	this.maxStam = stam;
	this.stam = stam;
	this.armor = 0;
	this.guard = 0;
	this.cp = 0;
	this.gainedCP = false;
	this.statusEffect = false;
	this.statuses = [];
	this.engaged = false;
	this.rollBonus = 0;
	this.dice = [];
	this.diceStrength = [startDice, startDice];
	this.inventory = {
		equipped : [],
		unequipped : []
	};
	this.breakDiceOn = {};
	this.turnTaken = false;

	allHeroes.push(this);
}

Hero.prototype.checkRoll = function(move, diceResults) {
	var result = diceResults.reduce(function(accum, current) {
		return accum + current;
	}, 0);
	return ((result + this.rollBonus) >= move.cost) ? true : false; 
};

Hero.prototype.askCP = function(attemptedMove) {
	if ((!this.gainedCP) && attemptedMove) {
		this.gainedCP = true;
		return this.cp += 1;
	} 
};

Hero.prototype.getStatus = function() {
	if (this.stam <= 0) {
		return 'Dead as hell';
	} else if (!this.statusEffect) {
		return 'Healthy';
	} else  {
		return 'Has ' + this.statuses.map(function(element) {
			return element.name;
	}).join(', ');
	}
}

Hero.prototype.$engageEnemy = function(enemy) {
	establishEngagement(this, enemy);
	currentCombatMessage = this.name + ' engaged ' + enemy.name + ' in melee combat!';
	$('#heroOptionsWindow1>div.engage').text(genEngageOption(this));
};

Hero.prototype.$disengageEnemy = function(enemy) {
	establishEngagement(this, enemy, true);
	currentCombatMessage = this.name + ' disengaged from their battle with ' + enemy.name + '.';
	$('#heroOptionsWindow1>div.engage').text(genEngageOption(this));
};


//hero generation zone

var heroMulholland = new Hero('Our Grave-Minded Quartermaster, Mulholland', 16, 'hardy');






//movelist

var allMoves = {
	sword : [],
	axe : [],
	hammer : [],
	dagger : [],
	spear : [],
	rapier : [],
	bow : [],
	shield : []
};

var costCeiling = 7;
(function (allMoves, costCeiling) {
	for (var weapon in allMoves) {
		for (var i = 0; i < costCeiling + 1; i++) {
		  allMoves[weapon].push({costOfMoves : i});
		};
	};
})(allMoves, costCeiling);


var Move = function(name, cost, weaponType, enemy, self, extra) {
	this.name = name;
	this.cost = cost;
	this.weaponType = weaponType;
	this.enemy = enemy;
	this.hero = self;
	this.extra = extra;
	if (weaponType === 'bow') {
		this.ranged = true;
	} else {
		this.ranged = false;
	}

	allMoves[weaponType][cost][name] = this;
};


Move.prototype.attack = function(target, weapon, hero) {
	var targetType = Object.getPrototypeOf(target).constructor.name.toLowerCase();
	return this[targetType](target, weapon, hero);
};





//movelist -- move creation

var swordMoveHack = new Move('hack', 1, 'sword', function(target){
	return (target.howManyBreak());
});
swordMoveHack.text = 'Deal damage equal to the number of break dice on an enemy.'

var swordMoveSlash = new Move('slash', 3, 'sword', function(target, weapon) {
	return (weapon.damage * 2);
});
swordMoveSlash.text = 'Deal twice this weapon\'s damage to an enemy.';







//weapon cards

var allWeapons = {
	allSwords : [],
	allAxes : [],
	allHammers : [],
	allDaggers : [],
	allSpears : [],
	allBows : [],
	allShields : []
}


var moveFinder = function(type, name) {
	return allMoves[type].findIndex(function(costObj) {
		return (costObj[name]);
	});
};


var Weapon = function(name, type, damage, twoHanded, worth, move1, move2, move3) {
	this.name = name;
	this.type = type;
	this.damage = damage;
	this.twoHanded = twoHanded;
	this.worth = worth;
	this.available = true;

	var move1Group = moveFinder(type, move1); 
	this.move1 = allMoves[type][move1Group][move1];

	if (move2) {
		var move2Group = moveFinder(type, move2); 
		this.move2 = allMoves[type][move2Group][move2];
	}

	if (move3) {
		var move3Group = moveFinder(type, move3); 
		this.move3 = allMoves[type][move3Group][move3];
	}

	var typePush = type[0].toUpperCase() + type.slice(1);
	allWeapons['all' + typePush + 's'].push(this);
};

//weaponlist - weapon creation zone

var unwieldyGreatsword = new Weapon('Unwieldy Greatsword', 'sword', 3, true, 99, 'hack', 'slash');











//enemy cards

var allEnemies = {
	'Deep Marshes' : [[],[],[],[]],
	'Rolling Hills' : [[],[],[],[]]
};


var Enemy = function(name, stam, tier, region, breakThresh) {
	this.name = name;
	this.stam = stam;
	this.maxStam = stam;
	this.tier = tier;
	this.region = region;
	this.breakThresh = breakThresh;
	this.breakDiceCurrent = [];
	this.broken = false;
	this.armor = 0;
	this.engaged = false;
	this.engagedTo = [];
	this.statusEffect = false;
	this.statuses = [];
	this.ultCharge = 0;
	this.reward = [];
	this.turnTaken = false;

	allEnemies[region][tier].push(this);
};

Enemy.prototype.howManyBreak = function() {
	return this.breakDiceCurrent.length;
};

Enemy.prototype.breakDiceTotal = function() {
	return this.breakDiceCurrent.reduce(function(accum, current) {
		return accum + current;
	}, 0);
};

Enemy.prototype.attack = function(target) {
	var attackSelected = enemyDice.roll();
	currentCombatMessage = this.name + ' rolled their ' + attackSelected + ' attack.';
	$printMessage();
	return this.moveset[attackSelected].call(this,target);
};

Enemy.prototype.chargeUlt = function() {
	currentCombatMessage = this.name + ' charges their ultimate attack.';
	this.ultCharge += 1;
	$printMessage();
	if (this.moveset.ultFiresOn <= this.ultCharge) {
		fireUlt(this);
	} else {
		currentCombatMessage = (this.moveset.ultFiresOn - this.ultCharge) + ' more charge to go...';
	}
};


var enemyMurkman = new Enemy('Murkman', 18, 2, 'Deep Marshes', 9);

enemyMurkman.moveset = {
	basic : function() {return 2},
	specialized : function() {
		arguments[0].forEach(enemySlipAllEngagement);
		this.engaged = false;
		this.engagedTo = [];
		currentCombatMessage = this.moveset.specializedText;
	},
	advanced : function() {
		if (this.stam < (this.maxStam - 6)) {
			this.stam += 6;
		} else {
			this.stam = this.maxStam;
		}		
		return 3;
	},
	basicText : 'Deals 2 damage to engaged heroes.',
	specializedText : 'Murkman slips out of engagement!',
	advancedText : 'Murkman regenerates 6 stamina, then deals 3 damage to engaged heroes.',
	ultimate : function() {
		return theParty.forEach(function(hero) {
			var message = '';
			var heroRoll = sixDice.roll();
			var rollPass;
			var rollMessage = 'avoided the ultimate!';
			heroRoll >= 4 ? rollPass = true : rollPass = false;
			if (!rollPass) {
				rollMessage = 'was afflicted by bogrot!';
				hero.statusEffect = true;
				hero.statuses.push(allStatuses.disease.bogrot);
			}
			message = hero.name + ' rolled a ' + heroRoll + ' and ' + rollMessage;
			$printMessage(message);
		})
	}, 
	ultFiresOn : 3,
	ultimateText : 'If heroes cannot roll a 4 or higher on a six-sided die, they\'ll be afflicted by bogrot!',
	hasOppo : true,
	oppo : function() {
		theParty.forEach(function(hero) {
			if (!hero.engaged) {
				dealDamage(hero, 1);
			}
		});
	},
	oppoText : 'Disengaging from the murkman will cause a hero to take 1 damage--this effect then ripples through the ranks of all' + 
		' other disengaged heroes!'
};

var enemySlipAllEngagement = function(unit) {
	unit.$disengageEnemy(theEnemyParty[0]);
	$disengageHeroCard(unit);
};


/*

enemy moveset template = {
	basic : 
	specialized : 
	advanced :
	basicText : 
	specializedText :
	advancedText : 
	ultimate :  
	ultFiresOn : 
	ultimateText :
};

*/

//status, diseases, boons, etc

var allStatuses = {
	disease : {
		bogrot : {
			name : 'bogrot',
			inCombat : false,
			inTown : false,
			inTravel : true,
			effTravel : function() {return 1},
		}
	}
};




