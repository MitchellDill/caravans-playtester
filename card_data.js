//hero cards
var allHeroes = [];

var Hero = function(name, stam, trait) {
	this.name = name;
	this.trait = allTraits[trait];
	this.stam = stam;
	this.armor = 0;
	this.guard = 0;
	this.statusEffect = false;
	this.engaged = false;
	this.rollBonus = 0;
	this.dice = [];
	this.inventory = {
		equipped : [],
		unequipped : []
	};

	allHeroes.push(this);
}

Hero.prototype.checkRoll = function(move, diceResults) {
	var result = diceResults.reduce(function(accum, current) {
		return accum + current;
	}, 0);
	return ((result + this.rollBonus) >= move.cost) ? true : false; 
};

//hero generation zone

var heroMulholland = new Hero('Our Grave-Minded Quartermaster, Mulholland', 16);




//traits

var allTraits = {

};



//weapon cards

var allWeapons = [];

var allSwords = [];
var allAxes = [];
var allHammers = [];
var allDaggers = [];
var allSpears = [];
var allBows = [];
var allShields = [];

var Weapon = function(name, type, damage, twoHanded, worth, move1, move2, move3) {
	this.name = name;
	this.type = type;
	this.damage = damage;
	this.twoHanded = twoHanded;
	this.worth = worth;
	this.available = true;

	var move1Group = moveFinder(type, move1); 
	this.move1 = allMoves[type][move1Group].move1;

	if (move2) {
		var move2Group = moveFinder(type, move2); 
		this.move1 = allMoves[type][move2Group].move2;
	}

	if (move3) {
		var move3Group = moveFinder(type, move3); 
		this.move1 = allMoves[type][move3Group].move3;
	}

	var typePush = type[0].toUpperCase() + type.slice(1);
	allWeapons['all' + typePush + 's'].push(this);
};

//weaponlist - weapon creation zone

var unwieldyGreatsword = new Weapon('Unwieldy Greatsword', 'sword', 3, true, 99, 'hack', 'slash');

allWeapons.push(allSwords, allAxes, allHammers, allDaggers, allSpears, allBows, allShields);



//movelist

var Move = function(name, cost, enemy, self, extra) {
	this.name = name;
	this.cost = cost;
	this.enemy = enemy;
	this.self = self;
	this.extra = extra;
};

Move.prototype.attack = function(target, weapon, hero) {
	var currentTarget = target.getPrototypeOf();
	return this[currentTarget](target, weapon, hero);
};

var moveFinder = function(type, name, abilCost) {
	var positiveCostsArray = allMoves[type].filter(function(costObj) {
		return costObj[name];
	});
	if (abilCost) {
		return positiveCostsArray.filter(function(costObj) {
			return (costObj === type + 'Cost' + abilCost);
		});
	}
	return positiveCostsObj[0];
};

var allMoves = {
	sword : [swordCost0, swordCost1, swordCost2, swordCost3];
	axe : [],
	hammer : [],
	dagger : [],
	spear : [],
	rapier : [],
	bow : [],
	shield : []
};


var swordCost0 = {};
var swordCost1 = {
	hack : swordMoveHack
};
var swordCost2 = {};
var swordCost3 = {
	slash : swordMoveSlash
};

//movelist -- move creation

var swordMoveHack = new Move('Hack', 1, function(target){
	return (target.howManyBreak);
});
var swordMoveSlash = new Move('Slash', 3, function(target, weapon) {
	return (weapon.damage * 2);
});




//dice

var Dice = function() {
	this.sides = [];
	for (var i = 0; i < arguments.length; i++) {
		this.sides.push(arguments[i]);
	};
};

Dice.prototype.roll = function() {
	return this.sides[Math.random() * this.sides.length];
}

var startDice = new Dice(0, 1, 2);
var midDice = new Dice(0, 1, 1, 2, 2, 3);
var endDice = new Dice(1, 2, 3);
var enemyDice = new Dice('basic', 'basic', 'basic', 'specialized', 'specialized', 'advanced');
var ultDice = new Dice(0, 1, 1, 1, 1, 2);
var sixDice = new Dice(1, 2, 3, 4, 5, 6);




//enemy cards

var allEnemies = [tier0Enemies, tier1Enemies, tier2Enemies, tier3Enemies];

var tier0Enemies = [];
var tier1Enemies = [];
var tier2Enemies = [];
var tier3Enemies = []; 

var Enemy = function(name, stam, tier, region, breakThresh) {
	this.name = name;
	this.stam = stam;
	this.tier = tier;
	this.region = region;
	this.breakThresh = breakThresh;
	this.breakDiceCurrent = [];
	this.armor = 0;
	this.engaged = false;
	this.statusEffect = false;
	/*
	this.moveset = allEnemyMoves[region][tier][name];
	*/
	this.ultCharge = 0;
	this.reward = [];

	allEnemies[tier].push(this);
};

Enemy.protoype.howManyBreak = function() {
	return this.breakDiceCurrent.length;
};

Enemy.protoype.breakDiceTotal = function() {
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
	basic :
	specialized : 
	advanced :
	basicText : 
	specializedText :
	advancedText : 
	ultimate :  
	ultFiresOn : 3,
	ultimateText :
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

//the engagement object

var currentEngagements = {};