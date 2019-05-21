
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
var midDice = new Dice(0, 1, 1, 2, 2, 3);
var endDice = new Dice(1, 2, 3);
var enemyDice = new Dice('basic', 'basic', 'basic', 'specialized', 'specialized', 'advanced');
var ultDice = new Dice(0, 1, 1, 1, 1, 2);
var sixDice = new Dice(1, 2, 3, 4, 5, 6);




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
var swordMoveSlash = new Move('slash', 3, 'sword', function(target, weapon) {
	return (weapon.damage * 2);
});







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
	return this.moveset[attackSelected](target);
};

var enemyMurkman = new Enemy('Murkman', 18, 2, 'Deep Marshes', 9);

enemyMurkman.moveset = {
	basic : function() {return 2},
	specialized : function() {
		arguments.forEach(enemySlipAllEngagement);
		this.engaged = false;
	},
	advanced : function() {
		this.stam += 6;
		return 3;
	},
	basicText : 'deals 2 damage to ',
	specializedText : 'slips out of engagement!',
	advancedText : 'regenerates back to ' + this.stam + 'stamina, then deals 3 damage to ',
	ultimate : function() {
		return party.map(function(hero) {
			var message = '';
			var heroRoll = sixDice();
			var rollPass;
			var rollMessage = 'avoided the ultimate!';
			heroRoll >= 4 ? rollPass = true : rollPass = false;
			if (!rollPass) {
				rollMessage = 'was afflicted by bogrot!';
				hero.statusEffect = true;
				hero.statuses.push(allStatuses.disease.bogrot);
			}
			return message = hero.name + ' rolled a ' + heroRoll + ' and ' + rollMessage;
		})
	}, 
	ultFiresOn : 3,
	ultimateText : 'If heroes cannot roll a 4 or higher on a six-sided die, they\'ll be afflicted by bogrot!',
	hasOppo : true,
	oppo : function() {return [1]},
	oppoText : 'Disengaging from the ' + this.name + 'will cause a hero to take 1 damage--this effect then ripples through the ranks of all' + 
		' other disengaged heroes!'
};

var enemySlipAllEngagement = function(element) {
	element.engaged = false;
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




//the combat and engagement object model
//enemies will now keep track of the heroes they engage with in an array

var theParty = [];
var theEnemyParty = [];

var establishEngagement = function(hero, enemy) {
	hero.engaged = true;
	enemy.engaged = true;
	enemy.engagedTo.push(hero);
};

