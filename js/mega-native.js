/* PokéSurvivor+ Mega Integration — source data: Stuff repo (Mega forms & SpriteCollab sprite sheets).
   Reward-flow hotfix. Does not alter Firebase, ownership or cloud saves. */
(()=>{'use strict';
const FORM_DATA={"3":[{"key":"3-mega","name":"Mega-Venusaur","en":"Mega Venusaur","types":["grass","poison"],"hp":106,"spd":112,"atk":1.25,"spa":1.37,"bst":625,"ab":"thick-fat","item":"stone","spr":0}],"6":[{"key":"6-mega-x","name":"Mega-Charizard X","en":"Mega Charizard X","types":["fire","dragon"],"hp":105,"spd":120,"atk":1.42,"spa":1.42,"bst":634,"ab":"tough-claws","item":"stone","spr":1,"src":"0006/0001"},{"key":"6-mega-y","name":"Mega-Charizard Y","en":"Mega Charizard Y","types":["fire","flying"],"hp":105,"spd":120,"atk":1.27,"spa":1.57,"bst":634,"ab":"drought","item":"stone","spr":0}],"9":[{"key":"9-mega","name":"Mega-Blastoise","en":"Mega Blastoise","types":["water"],"hp":106,"spd":111,"atk":1.27,"spa":1.44,"bst":630,"ab":"mega-launcher","item":"stone","spr":0}],"15":[{"key":"15-mega","name":"Mega-Beedrill","en":"Mega Beedrill","types":["bug","poison"],"hp":99,"spd":139,"atk":1.52,"spa":0.78,"bst":495,"ab":"adaptability","item":"stone","spr":0}],"18":[{"key":"18-mega","name":"Mega-Pidgeot","en":"Mega Pidgeot","types":["normal","flying"],"hp":107,"spd":129,"atk":1.14,"spa":1.44,"bst":579,"ab":"no-guard","item":"stone","spr":0}],"26":[{"key":"26-mega-x","name":"Mega-Raichu X","en":"Mega Raichu X","types":["electric"],"hp":97,"spd":124,"atk":1.44,"spa":1.2,"bst":585,"ab":"electric-surge","item":"stone","spr":0},{"key":"26-mega-y","name":"Mega-Raichu Y","en":"Mega Raichu Y","types":["electric"],"hp":97,"spd":133,"atk":1.25,"spa":1.58,"bst":585,"ab":"no-guard","item":"stone","spr":0}],"36":[{"key":"36-mega","name":"Mega-Clefable","en":"Mega Clefable","types":["fairy","flying"],"hp":113,"spd":107,"atk":1.14,"spa":1.44,"bst":583,"ab":"magic-bounce","item":"stone","spr":0}],"65":[{"key":"65-mega","name":"Mega-Alakazam","en":"Mega Alakazam","types":["psychic"],"hp":95,"spd":141,"atk":0.97,"spa":1.66,"bst":600,"ab":"trace","item":"stone","spr":1,"src":"0065/0001"}],"71":[{"key":"71-mega","name":"Mega-Victreebel","en":"Mega Victreebel","types":["grass","poison"],"hp":106,"spd":107,"atk":1.39,"spa":1.44,"bst":590,"ab":"innards-out","item":"stone","spr":0}],"80":[{"key":"80-mega","name":"Mega-Slowbro","en":"Mega Slowbro","types":["water","psychic"],"hp":113,"spd":91,"atk":1.11,"spa":1.42,"bst":590,"ab":"shell-armor","item":"stone","spr":1,"src":"0080/0002"}],"94":[{"key":"94-mega","name":"Mega-Gengar","en":"Mega Gengar","types":["ghost","poison"],"hp":97,"spd":133,"atk":1.06,"spa":1.64,"bst":600,"ab":"shadow-tag","item":"stone","spr":1,"src":"0094/0001"}],"115":[{"key":"115-mega","name":"Mega-Kangaskhan","en":"Mega Kangaskhan","types":["normal"],"hp":117,"spd":120,"atk":1.39,"spa":1.03,"bst":590,"ab":"parental-bond","item":"stone","spr":1,"src":"0115/0001"}],"121":[{"key":"121-mega","name":"Mega-Starmie","en":"Mega Starmie","types":["water","psychic"],"hp":97,"spd":128,"atk":1.25,"spa":1.42,"bst":620,"ab":"huge-power","item":"stone","spr":0}],"127":[{"key":"127-mega","name":"Mega-Pinsir","en":"Mega Pinsir","types":["bug","flying"],"hp":99,"spd":122,"atk":1.55,"spa":1.06,"bst":600,"ab":"aerilate","item":"stone","spr":0}],"130":[{"key":"130-mega","name":"Mega-Gyarados","en":"Mega Gyarados","types":["water","dark"],"hp":113,"spd":112,"atk":1.55,"spa":1.08,"bst":640,"ab":"mold-breaker","item":"stone","spr":0}],"142":[{"key":"142-mega","name":"Mega-Aerodactyl","en":"Mega Aerodactyl","types":["rock","flying"],"hp":106,"spd":141,"atk":1.44,"spa":1.08,"bst":615,"ab":"tough-claws","item":"stone","spr":1,"src":"0142/0001"}],"149":[{"key":"149-mega","name":"Mega-Dragonite","en":"Mega Dragonite","types":["dragon","flying"],"hp":111,"spd":120,"atk":1.38,"spa":1.5,"bst":700,"ab":"multiscale","item":"stone","spr":0}],"150":[{"key":"150-mega-x","name":"Mega-Mewtwo X","en":"Mega Mewtwo X","types":["psychic","fighting"],"hp":118,"spd":133,"atk":1.74,"spa":1.55,"bst":780,"ab":"steadfast","item":"stone","spr":0},{"key":"150-mega-y","name":"Mega-Mewtwo Y","en":"Mega Mewtwo Y","types":["psychic"],"hp":118,"spd":137,"atk":1.52,"spa":1.77,"bst":780,"ab":"insomnia","item":"stone","spr":1,"src":"0150/0002"}],"154":[{"key":"154-mega","name":"Mega-Meganium","en":"Mega Meganium","types":["grass","fairy"],"hp":106,"spd":112,"atk":1.21,"spa":1.49,"bst":625,"ab":"mega-sol","item":"stone","spr":0}],"160":[{"key":"160-mega","name":"Mega-Feraligatr","en":"Mega Feraligatr","types":["water","dragon"],"hp":108,"spd":111,"atk":1.58,"spa":1.19,"bst":630,"ab":"dragonize","item":"stone","spr":0}],"181":[{"key":"181-mega","name":"Mega-Ampharos","en":"Mega Ampharos","types":["electric","dragon"],"hp":110,"spd":97,"atk":1.22,"spa":1.61,"bst":610,"ab":"mold-breaker","item":"stone","spr":0}],"208":[{"key":"208-mega","name":"Mega-Steelix","en":"Mega Steelix","types":["steel","ground"],"hp":104,"spd":91,"atk":1.39,"spa":1,"bst":610,"ab":"sand-force","item":"stone","spr":1,"src":"0208/0001"}],"212":[{"key":"212-mega","name":"Mega-Scizor","en":"Mega Scizor","types":["bug","steel"],"hp":102,"spd":110,"atk":1.52,"spa":1.06,"bst":600,"ab":"technician","item":"stone","spr":0}],"214":[{"key":"214-mega","name":"Mega-Heracross","en":"Mega Heracross","types":["bug","fighting"],"hp":106,"spd":110,"atk":1.72,"spa":0.92,"bst":600,"ab":"skill-link","item":"stone","spr":0}],"227":[{"key":"227-mega","name":"Mega-Skarmory","en":"Mega Skarmory","types":["steel","flying"],"hp":99,"spd":124,"atk":1.47,"spa":0.92,"bst":565,"ab":"stalwart","item":"stone","spr":1,"src":"0227/0001"}],"229":[{"key":"229-mega","name":"Mega-Houndoom","en":"Mega Houndoom","types":["dark","fire"],"hp":104,"spd":126,"atk":1.2,"spa":1.47,"bst":600,"ab":"solar-power","item":"stone","spr":1,"src":"0229/0001"}],"248":[{"key":"248-mega","name":"Mega-Tyranitar","en":"Mega Tyranitar","types":["rock","dark"],"hp":115,"spd":108,"atk":1.6,"spa":1.22,"bst":700,"ab":"sand-stream","item":"stone","spr":1,"src":"0248/0001"}],"254":[{"key":"254-mega","name":"Mega-Sceptile","en":"Mega Sceptile","types":["grass","dragon"],"hp":102,"spd":139,"atk":1.31,"spa":1.5,"bst":630,"ab":"lightning-rod","item":"stone","spr":0}],"257":[{"key":"257-mega","name":"Mega-Blaziken","en":"Mega Blaziken","types":["fire","fighting"],"hp":106,"spd":120,"atk":1.58,"spa":1.42,"bst":630,"ab":"speed-boost","item":"stone","spr":0}],"260":[{"key":"260-mega","name":"Mega-Swampert","en":"Mega Swampert","types":["water","ground"],"hp":115,"spd":107,"atk":1.52,"spa":1.22,"bst":635,"ab":"swift-swim","item":"stone","spr":0}],"282":[{"key":"282-mega","name":"Mega-Gardevoir","en":"Mega Gardevoir","types":["psychic","fairy"],"hp":101,"spd":120,"atk":1.17,"spa":1.61,"bst":618,"ab":"pixilate","item":"stone","spr":1,"src":"0282/0001"}],"302":[{"key":"302-mega","name":"Mega-Sableye","en":"Mega Sableye","types":["dark","ghost"],"hp":92,"spd":86,"atk":1.17,"spa":1.17,"bst":480,"ab":"magic-bounce","item":"stone","spr":1,"src":"0302/0001"}],"303":[{"key":"303-mega","name":"Mega-Mawile","en":"Mega Mawile","types":["steel","fairy"],"hp":92,"spd":99,"atk":1.28,"spa":1,"bst":480,"ab":"huge-power","item":"stone","spr":1,"src":"0303/0001"}],"306":[{"key":"306-mega","name":"Mega-Aggron","en":"Mega Aggron","types":["steel"],"hp":102,"spd":99,"atk":1.47,"spa":1.03,"bst":630,"ab":"filter","item":"stone","spr":0}],"308":[{"key":"308-mega","name":"Mega-Medicham","en":"Mega Medicham","types":["fighting","psychic"],"hp":97,"spd":120,"atk":1.25,"spa":1.14,"bst":510,"ab":"pure-power","item":"stone","spr":1,"src":"0308/0001"}],"310":[{"key":"310-mega","name":"Mega-Manectric","en":"Mega Manectric","types":["electric"],"hp":102,"spd":135,"atk":1.11,"spa":1.44,"bst":575,"ab":"intimidate","item":"stone","spr":1,"src":"0310/0001"}],"319":[{"key":"319-mega","name":"Mega-Sharpedo","en":"Mega Sharpedo","types":["water","dark"],"hp":102,"spd":122,"atk":1.47,"spa":1.31,"bst":560,"ab":"strong-jaw","item":"stone","spr":1,"src":"0319/0001"}],"323":[{"key":"323-mega","name":"Mega-Camerupt","en":"Mega Camerupt","types":["fire","ground"],"hp":102,"spd":86,"atk":1.36,"spa":1.5,"bst":560,"ab":"sheer-force","item":"stone","spr":1,"src":"0323/0001"}],"334":[{"key":"334-mega","name":"Mega-Altaria","en":"Mega Altaria","types":["dragon","fairy"],"hp":104,"spd":112,"atk":1.31,"spa":1.31,"bst":590,"ab":"pixilate","item":"stone","spr":1,"src":"0334/0001"}],"354":[{"key":"354-mega","name":"Mega-Banette","en":"Mega Banette","types":["ghost"],"hp":99,"spd":110,"atk":1.61,"spa":1.21,"bst":555,"ab":"prankster","item":"stone","spr":1,"src":"0354/0001"}],"358":[{"key":"358-mega","name":"Mega-Chimecho","en":"Mega Chimecho","types":["psychic","steel"],"hp":104,"spd":105,"atk":0.97,"spa":1.44,"bst":555,"ab":"levitate","item":"stone","spr":0}],"359":[{"key":"359-mega","name":"Mega-Absol","en":"Mega Absol","types":["dark"],"hp":99,"spd":126,"atk":1.52,"spa":1.33,"bst":565,"ab":"magic-bounce","item":"stone","spr":1,"src":"0359/0001"},{"key":"359-mega-z","name":"Mega-Absol Z","en":"Mega Absol Z","types":["dark","ghost"],"hp":99,"spd":141,"atk":1.55,"spa":1.11,"bst":565,"ab":"sharpness","item":"stone","spr":0}],"362":[{"key":"362-mega","name":"Mega-Glalie","en":"Mega Glalie","types":["ice"],"hp":106,"spd":120,"atk":1.36,"spa":1.36,"bst":580,"ab":"refrigerate","item":"stone","spr":1,"src":"0362/0001"}],"373":[{"key":"373-mega","name":"Mega-Salamence","en":"Mega Salamence","types":["dragon","flying"],"hp":113,"spd":128,"atk":1.5,"spa":1.36,"bst":700,"ab":"aerilate","item":"stone","spr":0}],"376":[{"key":"376-mega","name":"Mega-Metagross","en":"Mega Metagross","types":["steel","psychic"],"hp":106,"spd":124,"atk":1.5,"spa":1.28,"bst":700,"ab":"tough-claws","item":"stone","spr":0}],"380":[{"key":"380-mega","name":"Mega-Latias","en":"Mega Latias","types":["dragon","psychic"],"hp":106,"spd":124,"atk":1.25,"spa":1.47,"bst":700,"ab":"levitate","item":"stone","spr":1,"src":"0380/0001"}],"381":[{"key":"381-mega","name":"Mega-Latios","en":"Mega Latios","types":["dragon","psychic"],"hp":106,"spd":124,"atk":1.42,"spa":1.58,"bst":700,"ab":"levitate","item":"stone","spr":1,"src":"0381/0001"}],"382":[{"key":"382-primal","name":"Kyogre Primigenio","en":"Primal Kyogre","types":["water"],"hp":115,"spd":116,"atk":1.52,"spa":1.69,"bst":770,"ab":"primordial-sea","item":"blue-orb","spr":1,"src":"0382/0001"}],"383":[{"key":"383-primal","name":"Groudon Primigenio","en":"Primal Groudon","types":["ground","fire"],"hp":115,"spd":116,"atk":1.69,"spa":1.52,"bst":770,"ab":"desolate-land","item":"red-orb","spr":1,"src":"0383/0001"}],"384":[{"key":"384-mega","name":"Mega-Rayquaza","en":"Mega Rayquaza","types":["dragon","flying"],"hp":117,"spd":126,"atk":1.69,"spa":1.69,"bst":780,"ab":"delta-stream","item":"dragon-ascent","spr":1,"src":"0384/0001"}],"398":[{"key":"398-mega","name":"Mega-Staraptor","en":"Mega Staraptor","types":["fighting","flying"],"hp":108,"spd":124,"atk":1.47,"spa":1.03,"bst":585,"ab":"contrary","item":"stone","spr":0}],"428":[{"key":"428-mega","name":"Mega-Lopunny","en":"Mega Lopunny","types":["normal","fighting"],"hp":99,"spd":135,"atk":1.45,"spa":1,"bst":580,"ab":"scrappy","item":"stone","spr":1,"src":"0428/0001"}],"445":[{"key":"445-mega","name":"Mega-Garchomp","en":"Mega Garchomp","types":["dragon","ground"],"hp":119,"spd":117,"atk":1.64,"spa":1.36,"bst":700,"ab":"sand-force","item":"stone","spr":0},{"key":"445-mega-z","name":"Mega-Garchomp Z","en":"Mega Garchomp Z","types":["dragon"],"hp":119,"spd":141,"atk":1.42,"spa":1.48,"bst":700,"ab":"levitate","item":"stone","spr":0}],"448":[{"key":"448-mega","name":"Mega-Lucario","en":"Mega Lucario","types":["fighting","steel"],"hp":102,"spd":125,"atk":1.5,"spa":1.47,"bst":625,"ab":"adaptability","item":"stone","spr":1,"src":"0448/0001"},{"key":"448-mega-z","name":"Mega-Lucario Z","en":"Mega Lucario Z","types":["fighting","steel"],"hp":102,"spd":141,"atk":1.25,"spa":1.6,"bst":625,"ab":"aura-guard","item":"stone","spr":0}],"460":[{"key":"460-mega","name":"Mega-Abomasnow","en":"Mega Abomasnow","types":["grass","ice"],"hp":110,"spd":91,"atk":1.43,"spa":1.43,"bst":594,"ab":"snow-warning","item":"stone","spr":0}],"475":[{"key":"475-mega","name":"Mega-Gallade","en":"Mega Gallade","types":["psychic","fighting"],"hp":101,"spd":124,"atk":1.61,"spa":1.06,"bst":618,"ab":"inner-focus","item":"stone","spr":1,"src":"0475/0001"}],"478":[{"key":"478-mega","name":"Mega-Froslass","en":"Mega Froslass","types":["ice","ghost"],"hp":102,"spd":128,"atk":1.14,"spa":1.47,"bst":580,"ab":"snow-warning","item":"stone","spr":0}],"485":[{"key":"485-mega","name":"Mega-Heatran","en":"Mega Heatran","types":["fire","steel"],"hp":111,"spd":106,"atk":1.36,"spa":1.66,"bst":700,"ab":null,"item":"stone","spr":0}],"491":[{"key":"491-mega","name":"Mega-Darkrai","en":"Mega Darkrai","types":["dark"],"hp":102,"spd":114,"atk":1.36,"spa":1.61,"bst":700,"ab":null,"item":"stone","spr":1,"src":"0491/0002"}],"500":[{"key":"500-mega","name":"Mega-Emboar","en":"Mega Emboar","types":["fire","fighting"],"hp":120,"spd":110,"atk":1.51,"spa":1.31,"bst":628,"ab":"mold-breaker","item":"stone","spr":0}],"530":[{"key":"530-mega","name":"Mega-Excadrill","en":"Mega Excadrill","types":["ground","steel"],"hp":120,"spd":121,"atk":1.61,"spa":1.06,"bst":608,"ab":"piercing-drill","item":"stone","spr":1,"src":"0530/0001"}],"531":[{"key":"531-mega","name":"Mega-Audino","en":"Mega Audino","types":["normal","fairy"],"hp":116,"spd":99,"atk":1.03,"spa":1.14,"bst":545,"ab":"healer","item":"stone","spr":0}],"545":[{"key":"545-mega","name":"Mega-Scolipede","en":"Mega Scolipede","types":["bug","poison"],"hp":97,"spd":104,"atk":1.47,"spa":1.11,"bst":585,"ab":"shell-armor","item":"stone","spr":0}],"560":[{"key":"560-mega","name":"Mega-Scrafty","en":"Mega Scrafty","types":["dark","fighting"],"hp":99,"spd":107,"atk":1.42,"spa":1,"bst":588,"ab":"intimidate","item":"stone","spr":1,"src":"0560/0001"}],"604":[{"key":"604-mega","name":"Mega-Eelektross","en":"Mega Eelektross","types":["electric"],"hp":108,"spd":112,"atk":1.5,"spa":1.44,"bst":615,"ab":"eelevate","item":"stone","spr":1,"src":"0604/0001"}],"609":[{"key":"609-mega","name":"Mega-Chandelure","en":"Mega Chandelure","types":["ghost","fire"],"hp":97,"spd":116,"atk":1.11,"spa":1.66,"bst":620,"ab":"infiltrator","item":"stone","spr":0}],"623":[{"key":"623-mega","name":"Mega-Golurk","en":"Mega Golurk","types":["ground","ghost"],"hp":110,"spd":101,"atk":1.57,"spa":1.08,"bst":583,"ab":"unseen-fist","item":"stone","spr":0}],"652":[{"key":"652-mega","name":"Mega-Chesnaught","en":"Mega Chesnaught","types":["grass","fighting"],"hp":110,"spd":96,"atk":1.45,"spa":1.11,"bst":630,"ab":"bulletproof","item":"stone","spr":0}],"655":[{"key":"655-mega","name":"Mega-Delphox","en":"Mega Delphox","types":["fire","psychic"],"hp":104,"spd":134,"atk":1.08,"spa":1.57,"bst":634,"ab":"levitate","item":"stone","spr":0}],"658":[{"key":"658-mega","name":"Mega-Greninja","en":"Mega Greninja","types":["water","dark"],"hp":102,"spd":138,"atk":1.39,"spa":1.43,"bst":630,"ab":"protean","item":"stone","spr":0}],"670":[{"key":"670-mega","name":"Mega-Floette","en":"Mega Floette","types":["fairy"],"hp":103,"spd":121,"atk":1.17,"spa":1.55,"bst":651,"ab":"fairy-aura","item":"stone","spr":1,"src":"0670/0006"}],"678":[{"key":"678-mega","name":"Mega-Meowstic","en":"Mega Meowstic","types":["psychic"],"hp":103,"spd":130,"atk":0.96,"spa":1.49,"bst":566,"ab":"trace","item":"stone","spr":0}],"687":[{"key":"687-mega","name":"Mega-Malamar","en":"Mega Malamar","types":["dark","psychic"],"hp":109,"spd":115,"atk":1.26,"spa":1.24,"bst":582,"ab":"contrary","item":"stone","spr":0}],"689":[{"key":"689-mega","name":"Mega-Barbaracle","en":"Mega Barbaracle","types":["rock","fighting"],"hp":102,"spd":115,"atk":1.47,"spa":1.05,"bst":600,"ab":"tough-claws","item":"stone","spr":0}],"691":[{"key":"691-mega","name":"Mega-Dragalge","en":"Mega Dragalge","types":["poison","dragon"],"hp":99,"spd":96,"atk":1.17,"spa":1.43,"bst":594,"ab":"regenerator","item":"stone","spr":1,"src":"0691/0001"}],"701":[{"key":"701-mega","name":"Mega-Hawlucha","en":"Mega Hawlucha","types":["fighting","flying"],"hp":105,"spd":128,"atk":1.45,"spa":1.11,"bst":600,"ab":"no-guard","item":"stone","spr":0}],"718":[{"key":"718-mega","name":"Mega-Zygarde","en":"Mega Zygarde","types":["dragon","ground"],"hp":167,"spd":120,"atk":1.08,"spa":1.89,"bst":778,"ab":null,"item":"stone","spr":1,"src":"0718/0005"}],"719":[{"key":"719-mega","name":"Mega-Diancie","en":"Mega Diancie","types":["rock","fairy"],"hp":92,"spd":124,"atk":1.58,"spa":1.58,"bst":700,"ab":"magic-bounce","item":"stone","spr":1,"src":"0719/0001"}],"740":[{"key":"740-mega","name":"Mega-Crabominable","en":"Mega Crabominable","types":["fighting","ice"],"hp":114,"spd":92,"atk":1.56,"spa":1.04,"bst":578,"ab":"iron-fist","item":"stone","spr":0}],"768":[{"key":"768-mega","name":"Mega-Golisopod","en":"Mega Golisopod","types":["bug","steel"],"hp":104,"spd":95,"atk":1.52,"spa":1.08,"bst":630,"ab":"tough-claws","item":"stone","spr":0}],"780":[{"key":"780-mega","name":"Mega-Drampa","en":"Mega Drampa","types":["normal","dragon"],"hp":105,"spd":93,"atk":1.17,"spa":1.58,"bst":585,"ab":"berserk","item":"stone","spr":1,"src":"0780/0001"}],"801":[{"key":"801-mega","name":"Mega-Magearna","en":"Mega Magearna","types":["steel","fairy"],"hp":106,"spd":118,"atk":1.39,"spa":1.64,"bst":700,"ab":null,"item":"stone","spr":0}],"807":[{"key":"807-mega","name":"Mega-Zeraora","en":"Mega Zeraora","types":["electric"],"hp":110,"spd":142,"atk":1.56,"spa":1.51,"bst":700,"ab":null,"item":"stone","spr":1,"src":"0807/0001"}],"952":[{"key":"952-mega","name":"Mega-Scovillain","en":"Mega Scovillain","types":["grass","fire"],"hp":99,"spd":110,"atk":1.46,"spa":1.46,"bst":586,"ab":"spicy-spray","item":"stone","spr":0}],"970":[{"key":"970-mega","name":"Mega-Glimmora","en":"Mega Glimmora","types":["rock","poison"],"hp":107,"spd":120,"atk":1.2,"spa":1.52,"bst":625,"ab":"adaptability","item":"stone","spr":0}],"978":[{"key":"978-mega","name":"Mega-Tatsugiri","en":"Mega Tatsugiri","types":["dragon","water"],"hp":101,"spd":117,"atk":1.06,"spa":1.44,"bst":575,"ab":null,"item":"stone","spr":1,"src":"0978/0003"}],"998":[{"key":"998-mega","name":"Mega-Baxcalibur","en":"Mega Baxcalibur","types":["dragon","ice"],"hp":122,"spd":115,"atk":1.66,"spa":1.28,"bst":700,"ab":"thermal-exchange","item":"stone","spr":0}]};
const SPRITE_META={"6-mega-x":{"s":2,"a":{"Idle":{"w":48,"h":56,"n":4,"r":8,"d":[15,15,15,15],"ax":23.5,"ay":31.5},"Walk":{"w":48,"h":56,"n":4,"r":8,"d":[8,10,8,10],"ax":23.5,"ay":31.5},"Attack":{"w":88,"h":96,"n":14,"r":8,"d":[2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":43.5,"ay":50.5},"Shoot":{"w":56,"h":64,"n":11,"r":8,"d":[4,6,2,2,2,2,2,2,2,2,2],"ax":27.5,"ay":34.5},"Charge":{"w":48,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":31.5},"Hurt":{"w":64,"h":64,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":33.5},"Faint":{"w":64,"h":64,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":33.5}},"sh":1,"sa":{"Idle":{"w":48,"h":48,"n":4,"r":8,"d":[15,15,15,15],"ax":23.5,"ay":27.5},"Walk":{"w":48,"h":48,"n":4,"r":8,"d":[8,10,8,10],"ax":23.5,"ay":27.5},"Attack":{"w":80,"h":88,"n":14,"r":8,"d":[2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":39.5,"ay":46.5},"Charge":{"w":48,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":27.5}}},"65-mega":{"s":1,"a":{"Idle":{"w":40,"h":64,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":19.5,"ay":35.5},"Walk":{"w":40,"h":64,"n":8,"r":8,"d":[8,10,8,10,8,10,8,10],"ax":19.5,"ay":35.5},"Attack":{"w":80,"h":96,"n":11,"r":8,"d":[4,2,4,1,1,1,2,2,2,2,4],"ax":39.5,"ay":51.5},"Shoot":{"w":40,"h":72,"n":12,"r":8,"d":[2,2,4,6,2,2,2,2,2,2,2,4],"ax":19.5,"ay":39.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":48,"h":72,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":36.5},"Faint":{"w":48,"h":72,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":36.5}},"sh":1},"80-mega":{"s":1,"a":{"Idle":{"w":32,"h":64,"n":5,"r":8,"d":[40,4,2,6,6],"ax":15.5,"ay":35.5},"Walk":{"w":48,"h":64,"n":8,"r":8,"d":[6,6,10,4,4,4,6,8],"ax":23.5,"ay":35.5},"Attack":{"w":80,"h":96,"n":14,"r":8,"d":[2,2,6,1,1,2,2,2,2,2,2,2,2,2],"ax":38.5,"ay":51.5},"Shoot":{"w":32,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":31.5},"Charge":{"w":32,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":31.5},"Hurt":{"w":32,"h":64,"n":5,"r":8,"d":[40,4,2,6,6],"ax":15.5,"ay":35.5},"Faint":{"w":32,"h":64,"n":5,"r":8,"d":[40,4,2,6,6],"ax":15.5,"ay":35.5}},"sh":1},"94-mega":{"s":2,"a":{"Idle":{"w":40,"h":40,"n":8,"r":8,"d":[40,4,3,3,3,3,3,4],"ax":19.5,"ay":23.5},"Walk":{"w":40,"h":40,"n":4,"r":8,"d":[8,10,8,10],"ax":19.5,"ay":23.5},"Attack":{"w":80,"h":80,"n":11,"r":8,"d":[4,2,4,1,1,1,2,2,2,2,4],"ax":39.5,"ay":43.5},"Shoot":{"w":64,"h":64,"n":12,"r":8,"d":[2,4,1,1,10,2,2,2,2,2,2,2],"ax":31.5,"ay":32.5},"Charge":{"w":48,"h":40,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":23.5},"Hurt":{"w":48,"h":48,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":25.5},"Faint":{"w":48,"h":48,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":25.5}},"sh":1},"115-mega":{"s":2,"a":{"Idle":{"w":40,"h":56,"n":5,"r":8,"d":[30,3,4,3,20],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":56,"n":4,"r":8,"d":[16,10,16,10],"ax":19.5,"ay":31.5},"Attack":{"w":72,"h":96,"n":13,"r":8,"d":[1,2,3,2,1,1,1,1,2,2,2,2,2],"ax":35.5,"ay":51.5},"Shoot":{"w":48,"h":56,"n":16,"r":8,"d":[2,1,1,1,1,1,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":30.5},"Charge":{"w":32,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":27.5},"Hurt":{"w":40,"h":64,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":33.5},"Faint":{"w":40,"h":64,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":33.5}},"sh":1},"142-mega":{"s":1,"a":{"Idle":{"w":40,"h":64,"n":8,"r":8,"d":[8,8,8,8,8,8,8,8],"ax":19.5,"ay":35.5},"Walk":{"w":40,"h":64,"n":4,"r":8,"d":[8,8,8,8],"ax":19.5,"ay":35.5},"Attack":{"w":72,"h":80,"n":13,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2,2],"ax":35.5,"ay":43.5},"Shoot":{"w":56,"h":72,"n":12,"r":8,"d":[2,2,6,1,1,2,2,2,2,2,2,2],"ax":27.5,"ay":38.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":40,"h":72,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":37.5},"Faint":{"w":40,"h":72,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":37.5}},"sh":1},"150-mega-y":{"s":1,"a":{"Idle":{"w":48,"h":56,"n":8,"r":8,"d":[20,15,12,12,12,15,12,15],"ax":23.5,"ay":34.5},"Walk":{"w":40,"h":56,"n":6,"r":8,"d":[12,8,8,12,8,8],"ax":20.5,"ay":31.5},"Attack":{"w":80,"h":88,"n":11,"r":8,"d":[2,3,4,1,1,1,2,2,2,2,2],"ax":39.5,"ay":46.5},"Shoot":{"w":48,"h":56,"n":9,"r":8,"d":[3,5,5,5,5,5,5,5,3],"ax":19.5,"ay":31.5},"Charge":{"w":40,"h":56,"n":10,"r":8,"d":[4,4,4,4,4,4,4,4,4,4],"ax":20.5,"ay":32.5},"Hurt":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":22.5,"ay":30.5},"Faint":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":22.5,"ay":30.5}},"sh":1},"208-mega":{"s":2,"a":{"Idle":{"w":64,"h":136,"n":4,"r":8,"d":[16,12,16,12],"ax":31.5,"ay":71.5},"Walk":{"w":72,"h":128,"n":4,"r":8,"d":[10,14,10,14],"ax":35.5,"ay":67.5},"Attack":{"w":120,"h":176,"n":11,"r":8,"d":[2,6,1,1,1,2,2,2,2,2,2],"ax":59.5,"ay":90.5},"Shoot":{"w":96,"h":136,"n":12,"r":8,"d":[2,2,6,2,2,2,2,2,2,2,2,2],"ax":47.5,"ay":69.5},"Charge":{"w":64,"h":128,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":67.5},"Hurt":{"w":64,"h":128,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":65.5},"Faint":{"w":64,"h":128,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":65.5}},"sh":1},"227-mega":{"s":1,"a":{"Idle":{"w":48,"h":72,"n":7,"r":8,"d":[40,4,4,4,4,4,4],"ax":23.5,"ay":39.5},"Walk":{"w":48,"h":80,"n":9,"r":8,"d":[4,4,4,4,8,8,8,8,8],"ax":23.5,"ay":43.5},"Attack":{"w":88,"h":96,"n":14,"r":8,"d":[3,3,3,3,3,2,2,3,3,3,3,3,8,2],"ax":43.5,"ay":50.5},"Shoot":{"w":48,"h":64,"n":8,"r":8,"d":[3,6,6,3,3,3,10,3],"ax":23.5,"ay":35.5},"Charge":{"w":48,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":31.5},"Hurt":{"w":48,"h":80,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":41.5},"Faint":{"w":48,"h":80,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":41.5}}},"229-mega":{"s":1,"a":{"Idle":{"w":40,"h":64,"n":14,"r":8,"d":[60,10,2,2,2,2,2,2,2,2,2,2,2,10],"ax":19.5,"ay":35.5},"Walk":{"w":40,"h":64,"n":4,"r":8,"d":[8,12,8,12],"ax":19.5,"ay":35.5},"Attack":{"w":64,"h":88,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":31.5,"ay":46.5},"Shoot":{"w":48,"h":64,"n":12,"r":8,"d":[6,2,6,1,1,2,2,2,2,2,2,2],"ax":23.5,"ay":33.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5},"Faint":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5}},"sh":1},"248-mega":{"s":1,"a":{"Idle":{"w":40,"h":56,"n":4,"r":8,"d":[14,24,14,24],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":56,"n":4,"r":8,"d":[10,16,10,16],"ax":19.5,"ay":31.5},"Attack":{"w":64,"h":88,"n":11,"r":8,"d":[2,2,4,1,2,2,2,2,2,2,2],"ax":31.5,"ay":46.5},"Shoot":{"w":48,"h":56,"n":13,"r":8,"d":[2,3,6,1,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":29.5},"Charge":{"w":40,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":27.5},"Hurt":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5},"Faint":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5}}},"282-mega":{"s":1,"a":{"Idle":{"w":32,"h":48,"n":4,"r":8,"d":[6,12,6,12],"ax":15.5,"ay":27.5},"Walk":{"w":32,"h":40,"n":4,"r":8,"d":[8,12,8,12],"ax":15.5,"ay":23.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Shoot":{"w":32,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":27.5},"Charge":{"w":32,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":27.5},"Hurt":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":30.5},"Faint":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":30.5}},"sh":1},"302-mega":{"s":2,"a":{"Idle":{"w":40,"h":56,"n":2,"r":8,"d":[40,20],"ax":19.5,"ay":31.5},"Walk":{"w":32,"h":56,"n":4,"r":8,"d":[6,8,6,8],"ax":15.5,"ay":31.5},"Attack":{"w":72,"h":96,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":35.5,"ay":50.5},"Shoot":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":56,"h":72,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":35.5},"Faint":{"w":56,"h":72,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":35.5}},"sh":1},"303-mega":{"s":1,"a":{"Idle":{"w":56,"h":56,"n":13,"r":8,"d":[40,2,2,2,4,6,4,6,4,2,2,2,4],"ax":27.5,"ay":31.5},"Walk":{"w":48,"h":56,"n":4,"r":8,"d":[8,10,8,10],"ax":23.5,"ay":31.5},"Attack":{"w":72,"h":96,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":35.5,"ay":50.5},"Shoot":{"w":72,"h":72,"n":15,"r":8,"d":[1,1,1,2,6,1,1,2,2,2,4,2,2,1,1],"ax":35.5,"ay":39.5},"Charge":{"w":56,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":28.5,"ay":31.5},"Hurt":{"w":64,"h":64,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":33.5},"Faint":{"w":40,"h":48,"n":4,"r":8,"d":[8,12,4,10],"ax":19.5,"ay":27.5}},"sh":1},"308-mega":{"s":1,"a":{"Idle":{"w":32,"h":56,"n":6,"r":8,"d":[40,8,8,8,8,8],"ax":15.5,"ay":31.5},"Walk":{"w":32,"h":56,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":15.5,"ay":31.5},"Attack":{"w":72,"h":80,"n":11,"r":8,"d":[2,2,4,2,2,2,2,2,2,2,2],"ax":35.5,"ay":43.5},"Shoot":{"w":40,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":31.5},"Charge":{"w":40,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":31.5},"Hurt":{"w":48,"h":72,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":35.5},"Faint":{"w":48,"h":72,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":35.5}}},"310-mega":{"s":1,"a":{"Idle":{"w":40,"h":56,"n":14,"r":8,"d":[60,10,2,2,2,2,2,2,2,2,2,2,2,10],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":56,"n":4,"r":8,"d":[8,10,8,10],"ax":19.5,"ay":31.5},"Attack":{"w":72,"h":88,"n":13,"r":8,"d":[2,2,6,2,2,2,2,2,2,2,2,2,2],"ax":35.5,"ay":44.5},"Shoot":{"w":48,"h":64,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":33.5},"Charge":{"w":40,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":31.5},"Hurt":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5},"Faint":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5}},"sh":1},"319-mega":{"s":1,"a":{"Idle":{"w":40,"h":48,"n":4,"r":8,"d":[16,16,16,16],"ax":19.5,"ay":27.5},"Walk":{"w":40,"h":56,"n":8,"r":8,"d":[10,8,8,8,10,8,8,8],"ax":19.5,"ay":31.5},"Attack":{"w":80,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":39.5,"ay":42.5},"Shoot":{"w":80,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":39.5,"ay":42.5},"Charge":{"w":40,"h":48,"n":4,"r":8,"d":[16,16,16,16],"ax":19.5,"ay":27.5},"Hurt":{"w":40,"h":48,"n":4,"r":8,"d":[16,16,16,16],"ax":19.5,"ay":27.5},"Faint":{"w":40,"h":48,"n":4,"r":8,"d":[16,16,16,16],"ax":19.5,"ay":27.5}},"sh":1},"323-mega":{"s":1,"a":{"Idle":{"w":40,"h":48,"n":4,"r":8,"d":[8,20,8,20],"ax":19.5,"ay":27.5},"Walk":{"w":40,"h":48,"n":4,"r":8,"d":[8,10,8,10],"ax":19.5,"ay":27.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Shoot":{"w":48,"h":48,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":25.5},"Charge":{"w":40,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":27.5},"Hurt":{"w":40,"h":64,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":33.5},"Faint":{"w":40,"h":64,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":33.5}},"sh":1},"334-mega":{"s":2,"a":{"Idle":{"w":64,"h":104,"n":8,"r":8,"d":[12,12,12,12,12,12,12,12],"ax":31.5,"ay":55.5},"Walk":{"w":64,"h":104,"n":10,"r":8,"d":[6,6,8,8,6,6,6,8,8,6],"ax":31.5,"ay":55.5},"Attack":{"w":72,"h":128,"n":15,"r":8,"d":[2,2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":35.5,"ay":67.5},"Shoot":{"w":80,"h":120,"n":14,"r":8,"d":[2,2,2,2,6,1,1,2,2,2,2,2,2,2],"ax":39.5,"ay":63.5},"Charge":{"w":64,"h":112,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":59.5},"Hurt":{"w":72,"h":120,"n":2,"r":8,"d":[2,8],"ax":35.5,"ay":59.5},"Faint":{"w":72,"h":120,"n":2,"r":8,"d":[2,8],"ax":35.5,"ay":59.5}},"sh":1},"354-mega":{"s":1,"a":{"Idle":{"w":32,"h":64,"n":9,"r":8,"d":[50,6,6,6,6,6,6,6,6],"ax":15.5,"ay":35.5},"Walk":{"w":32,"h":64,"n":4,"r":8,"d":[8,10,8,10],"ax":15.5,"ay":35.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Shoot":{"w":32,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":35.5},"Charge":{"w":32,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":35.5},"Hurt":{"w":56,"h":80,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":41.5},"Faint":{"w":56,"h":80,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":41.5}},"sh":1},"359-mega":{"s":1,"a":{"Idle":{"w":40,"h":56,"n":2,"r":8,"d":[30,30],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":56,"n":4,"r":8,"d":[8,10,8,10],"ax":19.5,"ay":31.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Shoot":{"w":72,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Charge":{"w":40,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":31.5},"Hurt":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5},"Faint":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5}},"sh":1},"362-mega":{"s":2,"a":{"Idle":{"w":32,"h":72,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":15.5,"ay":39.5},"Walk":{"w":32,"h":72,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":15.5,"ay":39.5},"Attack":{"w":72,"h":104,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":35.5,"ay":54.5},"Shoot":{"w":48,"h":72,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":37.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":48,"h":80,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":39.5},"Faint":{"w":48,"h":80,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":39.5}},"sh":1},"380-mega":{"s":2,"a":{"Idle":{"w":72,"h":72,"n":6,"r":8,"d":[8,8,8,8,8,8],"ax":35.5,"ay":39.5},"Walk":{"w":72,"h":72,"n":12,"r":8,"d":[4,4,4,4,4,4,4,4,4,4,4,4],"ax":35.5,"ay":39.5},"Attack":{"w":88,"h":80,"n":11,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2],"ax":43.5,"ay":42.5},"Shoot":{"w":80,"h":88,"n":12,"r":8,"d":[2,6,1,1,2,2,2,2,2,2,2,2],"ax":39.5,"ay":45.5},"Charge":{"w":80,"h":88,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":40.5,"ay":47.5},"Hurt":{"w":80,"h":96,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":49.5},"Faint":{"w":80,"h":96,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":49.5}},"sh":1},"381-mega":{"s":2,"a":{"Idle":{"w":80,"h":80,"n":6,"r":8,"d":[8,8,8,8,8,8],"ax":39.5,"ay":43.5},"Walk":{"w":80,"h":80,"n":12,"r":8,"d":[4,4,4,4,4,4,4,4,4,4,4,4],"ax":39.5,"ay":43.5},"Attack":{"w":96,"h":88,"n":11,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2],"ax":47.5,"ay":46.5},"Shoot":{"w":88,"h":96,"n":12,"r":8,"d":[2,6,1,1,2,2,2,2,2,2,2,2],"ax":43.5,"ay":49.5},"Charge":{"w":88,"h":88,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":44.5,"ay":47.5},"Hurt":{"w":80,"h":104,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":53.5},"Faint":{"w":80,"h":104,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":53.5}},"sh":1},"382-primal":{"s":2,"a":{"Idle":{"w":64,"h":72,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":31.5,"ay":39.5},"Walk":{"w":64,"h":72,"n":10,"r":8,"d":[8,8,8,8,8,8,8,8,8,8],"ax":31.5,"ay":39.5},"Attack":{"w":80,"h":72,"n":10,"r":8,"d":[2,6,1,1,2,2,2,2,2,2],"ax":39.5,"ay":38.5},"Shoot":{"w":72,"h":72,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":35.5,"ay":37.5},"Charge":{"w":64,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":35.5},"Hurt":{"w":64,"h":88,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":43.5},"Faint":{"w":64,"h":88,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":43.5}},"sh":1},"383-primal":{"s":2,"a":{"Idle":{"w":72,"h":80,"n":14,"r":8,"d":[60,10,2,2,2,2,2,2,2,2,2,2,2,10],"ax":35.5,"ay":43.5},"Walk":{"w":72,"h":80,"n":4,"r":8,"d":[10,12,10,12],"ax":35.5,"ay":43.5},"Attack":{"w":88,"h":104,"n":10,"r":8,"d":[2,6,1,1,2,2,2,2,2,2],"ax":43.5,"ay":54.5},"Shoot":{"w":80,"h":88,"n":12,"r":8,"d":[2,2,6,2,2,2,2,2,2,2,2,2],"ax":39.5,"ay":45.5},"Charge":{"w":64,"h":80,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":43.5},"Hurt":{"w":72,"h":80,"n":2,"r":8,"d":[2,8],"ax":35.5,"ay":39.5},"Faint":{"w":72,"h":80,"n":2,"r":8,"d":[2,8],"ax":35.5,"ay":39.5}},"sh":1},"384-mega":{"s":2,"a":{"Idle":{"w":144,"h":136,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":71.5,"ay":71.5},"Walk":{"w":144,"h":128,"n":4,"r":8,"d":[16,16,16,16],"ax":71.5,"ay":67.5},"Attack":{"w":176,"h":144,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":87.5,"ay":74.5},"Shoot":{"w":120,"h":136,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":59.5,"ay":69.5},"Charge":{"w":128,"h":136,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":64.5,"ay":71.5},"Hurt":{"w":104,"h":144,"n":2,"r":8,"d":[2,8],"ax":51.5,"ay":73.5},"Faint":{"w":104,"h":144,"n":2,"r":8,"d":[2,8],"ax":51.5,"ay":73.5}},"sh":1},"428-mega":{"s":1,"a":{"Idle":{"w":40,"h":56,"n":7,"r":8,"d":[20,4,2,4,4,2,6],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":64,"n":9,"r":8,"d":[6,2,2,4,4,4,4,6,4],"ax":19.5,"ay":33.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,2,6,1,2,2,4,4,2,2],"ax":35.5,"ay":41.5},"Shoot":{"w":48,"h":56,"n":12,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2],"ax":23.5,"ay":30.5},"Charge":{"w":40,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":27.5},"Hurt":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":29.5},"Faint":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":29.5}},"sh":1},"448-mega":{"s":1,"a":{"Idle":{"w":32,"h":48,"n":10,"r":8,"d":[40,2,2,2,2,2,2,2,2,12],"ax":15.5,"ay":27.5},"Walk":{"w":32,"h":48,"n":4,"r":8,"d":[8,10,8,10],"ax":15.5,"ay":27.5},"Attack":{"w":64,"h":80,"n":13,"r":8,"d":[2,2,2,2,1,1,1,1,2,2,2,2,2],"ax":32.5,"ay":41.5},"Shoot":{"w":64,"h":80,"n":13,"r":8,"d":[2,2,2,2,1,1,1,1,2,2,2,2,2],"ax":32.5,"ay":41.5},"Charge":{"w":32,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":27.5},"Hurt":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5},"Faint":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5}},"sh":1},"475-mega":{"s":1,"a":{"Idle":{"w":24,"h":64,"n":5,"r":8,"d":[60,2,6,2,26],"ax":11.5,"ay":35.5},"Walk":{"w":24,"h":48,"n":4,"r":8,"d":[12,12,12,12],"ax":11.5,"ay":27.5},"Attack":{"w":64,"h":80,"n":13,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2,1,2],"ax":31.5,"ay":41.5},"Shoot":{"w":40,"h":56,"n":12,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2],"ax":19.5,"ay":30.5},"Charge":{"w":24,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":12.5,"ay":31.5},"Hurt":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5},"Faint":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5}},"sh":1},"491-mega":{"s":2,"a":{"Idle":{"w":96,"h":96,"n":11,"r":8,"d":[10,5,10,5,10,5,10,5,10,5,15],"ax":47.5,"ay":51.5},"Walk":{"w":96,"h":96,"n":6,"r":8,"d":[10,10,10,10,10,10],"ax":47.5,"ay":51.5},"Attack":{"w":104,"h":136,"n":10,"r":8,"d":[3,3,2,2,2,2,4,4,4,2],"ax":51.5,"ay":71.5},"Shoot":{"w":96,"h":96,"n":12,"r":8,"d":[3,5,6,3,3,4,4,4,4,4,2,2],"ax":47.5,"ay":49.5},"Charge":{"w":88,"h":80,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":43.5,"ay":43.5},"Hurt":{"w":88,"h":104,"n":2,"r":8,"d":[2,8],"ax":43.5,"ay":53.5},"Faint":{"w":88,"h":104,"n":2,"r":8,"d":[2,8],"ax":43.5,"ay":53.5}}},"530-mega":{"s":2,"a":{"Idle":{"w":72,"h":64,"n":4,"r":8,"d":[48,18,28,24],"ax":35.5,"ay":35.5},"Walk":{"w":64,"h":64,"n":4,"r":8,"d":[10,16,10,16],"ax":31.5,"ay":35.5},"Attack":{"w":120,"h":104,"n":11,"r":8,"d":[2,2,2,6,2,2,2,2,2,2,2],"ax":59.5,"ay":54.5},"Shoot":{"w":80,"h":72,"n":13,"r":8,"d":[2,3,6,1,2,2,2,2,2,2,2,2,2],"ax":39.5,"ay":37.5},"Charge":{"w":72,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":36.5,"ay":35.5},"Hurt":{"w":80,"h":64,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":33.5},"Faint":{"w":80,"h":64,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":33.5}},"sh":1},"560-mega":{"s":1,"a":{"Idle":{"w":32,"h":48,"n":1,"r":8,"d":[8],"ax":15.5,"ay":27.5},"Walk":{"w":32,"h":48,"n":4,"r":8,"d":[8,10,8,10],"ax":15.5,"ay":27.5},"Attack":{"w":72,"h":96,"n":14,"r":8,"d":[2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":35.5,"ay":50.5},"Shoot":{"w":72,"h":96,"n":14,"r":8,"d":[2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":35.5,"ay":50.5},"Charge":{"w":32,"h":48,"n":1,"r":8,"d":[8],"ax":15.5,"ay":27.5},"Hurt":{"w":32,"h":48,"n":1,"r":8,"d":[8],"ax":15.5,"ay":27.5},"Faint":{"w":32,"h":48,"n":1,"r":8,"d":[8],"ax":15.5,"ay":27.5}},"sh":1},"604-mega":{"s":2,"a":{"Idle":{"w":80,"h":72,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":39.5,"ay":39.5},"Walk":{"w":80,"h":72,"n":10,"r":8,"d":[8,8,8,8,8,8,8,8,8,8],"ax":39.5,"ay":39.5},"Attack":{"w":88,"h":104,"n":14,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2,2,2],"ax":43.5,"ay":53.5},"Shoot":{"w":88,"h":64,"n":12,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2],"ax":43.5,"ay":34.5},"Charge":{"w":72,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":36.5,"ay":35.5},"Hurt":{"w":80,"h":72,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":37.5},"Faint":{"w":80,"h":72,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":37.5}},"sh":1},"670-mega":{"s":1,"a":{"Idle":{"w":80,"h":120,"n":18,"r":8,"d":[10,14,14,14,14,10,2,2,2,2,2,2,2,14,14,14,14,14],"ax":39.5,"ay":63.5},"Walk":{"w":80,"h":112,"n":10,"r":8,"d":[8,8,8,8,8,8,8,8,8,8],"ax":39.5,"ay":59.5},"Attack":{"w":128,"h":112,"n":15,"r":8,"d":[2,2,1,3,1,3,2,1,2,2,2,2,2,2,10],"ax":63.5,"ay":58.5},"Shoot":{"w":112,"h":112,"n":13,"r":8,"d":[2,3,4,4,1,1,2,2,2,2,2,2,8],"ax":55.5,"ay":57.5},"Charge":{"w":104,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":52.5,"ay":35.5},"Hurt":{"w":88,"h":112,"n":2,"r":8,"d":[2,8],"ax":43.5,"ay":55.5},"Faint":{"w":88,"h":112,"n":2,"r":8,"d":[2,8],"ax":43.5,"ay":55.5}},"sh":1},"691-mega":{"s":1,"a":{"Idle":{"w":48,"h":80,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":23.5,"ay":43.5},"Walk":{"w":56,"h":72,"n":5,"r":8,"d":[10,10,12,10,12],"ax":27.5,"ay":39.5},"Attack":{"w":88,"h":96,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":43.5,"ay":50.5},"Shoot":{"w":56,"h":80,"n":11,"r":8,"d":[2,6,1,2,2,2,2,2,2,2,2],"ax":27.5,"ay":41.5},"Charge":{"w":48,"h":72,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":39.5},"Hurt":{"w":56,"h":88,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":45.5},"Faint":{"w":56,"h":88,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":45.5}},"sh":1},"718-mega":{"s":2,"a":{"Idle":{"w":120,"h":200,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":59.5,"ay":103.5},"Walk":{"w":120,"h":200,"n":10,"r":8,"d":[8,8,8,8,8,8,8,8,8,8],"ax":59.5,"ay":103.5},"Attack":{"w":160,"h":224,"n":14,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2,2,2,2],"ax":79.5,"ay":113.5},"Shoot":{"w":128,"h":184,"n":14,"r":8,"d":[2,10,1,2,2,2,2,2,2,2,2,2,2,4],"ax":63.5,"ay":93.5},"Charge":{"w":120,"h":184,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":60.5,"ay":95.5},"Hurt":{"w":120,"h":184,"n":2,"r":8,"d":[2,8],"ax":59.5,"ay":91.5},"Faint":{"w":120,"h":184,"n":2,"r":8,"d":[2,8],"ax":59.5,"ay":91.5}},"sh":1},"719-mega":{"s":1,"a":{"Idle":{"w":64,"h":88,"n":4,"r":8,"d":[16,12,16,12],"ax":31.5,"ay":47.5},"Walk":{"w":56,"h":88,"n":9,"r":8,"d":[4,4,4,4,4,4,4,4,4],"ax":27.5,"ay":47.5},"Attack":{"w":80,"h":104,"n":14,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2,2,1,2],"ax":39.5,"ay":53.5},"Shoot":{"w":56,"h":88,"n":12,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2],"ax":27.5,"ay":46.5},"Charge":{"w":64,"h":96,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":51.5},"Hurt":{"w":48,"h":88,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":45.5},"Faint":{"w":48,"h":88,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":45.5}},"sh":1},"780-mega":{"s":2,"a":{"Idle":{"w":64,"h":104,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":31.5,"ay":55.5},"Walk":{"w":64,"h":104,"n":10,"r":8,"d":[8,8,6,6,6,8,8,6,6,6],"ax":31.5,"ay":55.5},"Attack":{"w":120,"h":120,"n":14,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2,2,2,2],"ax":59.5,"ay":61.5},"Shoot":{"w":88,"h":112,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":43.5,"ay":57.5},"Charge":{"w":64,"h":112,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":59.5},"Hurt":{"w":80,"h":136,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":67.5},"Faint":{"w":80,"h":136,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":67.5}},"sh":1},"807-mega":{"s":1,"a":{"Idle":{"w":48,"h":48,"n":10,"r":8,"d":[40,2,2,2,2,2,2,2,2,12],"ax":23.5,"ay":27.5},"Walk":{"w":48,"h":48,"n":4,"r":8,"d":[6,6,6,6],"ax":23.5,"ay":27.5},"Attack":{"w":64,"h":72,"n":15,"r":8,"d":[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],"ax":31.5,"ay":38.5},"Shoot":{"w":64,"h":72,"n":15,"r":8,"d":[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],"ax":31.5,"ay":38.5},"Charge":{"w":48,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":27.5},"Hurt":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":29.5},"Faint":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":29.5}},"sh":1},"978-mega":{"s":1,"a":{"Idle":{"w":40,"h":48,"n":8,"r":8,"d":[8,8,8,8,8,8,8,8],"ax":19.5,"ay":27.5},"Walk":{"w":40,"h":48,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":19.5,"ay":27.5},"Attack":{"w":88,"h":72,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":43.5,"ay":38.5},"Shoot":{"w":48,"h":48,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":25.5},"Charge":{"w":40,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":27.5},"Hurt":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5},"Faint":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5}},"sh":1}};
let current=null, used=false, restore=null;
let lastLevel=0, rewardPending=false;
const ROLL_CHANCE=0.50; // TESTING: 50%. For release, set to 0.01 (1%).
let stoneOwned=false;
function allowMegaByLevel(player, forms){
  const lv=Number(player?.level||1);
  if(player!==current){lastLevel=lv; rewardPending=false; return;}
  if(!player||used||!forms.length||lv<10||rewardPending||stoneOwned)return;
  if(lastLevel<1){lastLevel=lv;return;}
  if(lv>lastLevel){
    // Each level-up at level 10+ gives one roll, using ROLL_CHANCE.
    for(let newLv=Math.max(10,lastLevel+1);newLv<=lv;newLv++){
      if(Math.random()<ROLL_CHANCE){rewardPending=true;break;}
    }
  }
  lastLevel=lv;
}
const getBridge=()=>window.PS_MEGA_BRIDGE_V5;
 // ================= PRIMAL REVERSION =================
 // Tuning knobs: edit these numbers to rebalance Primal Kyogre / Groudon.
 // Multipliers are relative to the Pokemon's stats right before Primal Reversion.
 const PRIMAL_BALANCE={atk:1.8,spa:1.8,hp:1.6,spd:1.1};
 const PRIMAL_RADIUS=430; // world units: size of the visual weather domain around the player

 // Primal weather tables. The engine applies these to every kind of move (projectiles, melee,
 // beams, auras, chains...) and to enemy attacks on the Primal player.
 // ONLY the types listed in 'mult' change. Every other type stays at exactly 1x.
 const WEATHER={
  '383-primal':{name:'Desolate Land',kind:'harsh',hint:'Fire moves deal 1.5x, Water moves evaporate (0.1x)',mult:{fire:1.5,water:0.1},ring:'#ffb347',fx:'sun'},
  '382-primal':{name:'Primordial Sea',kind:'storm',hint:'Water moves deal 1.5x, Fire moves fizzle out (0.1x)',mult:{water:1.5,fire:0.1},ring:'#54cfff',fx:'rain'}
 };
 let activePrimal=null; // {player,cfg}

 // Signature moves: real entries in the game's move database, learned on Primal Reversion.
 // Origin Pulse is a 'chain' move like Hex: it locks on to the nearest foe (tracking) and arcs
 // lightning-style beams from foe to foe (each jump does 85% of the previous one).
 const SIGNATURE_MOVES={
   // Both are granted already at MAX level (see grantSignature). Numbers below are level-1 base values;
   // max level adds: nova +8 projectiles, +40% dmg, +1 pierce, -25% cooldown;
   //                 chain +4 jumps, ~2x dmg, -25% cooldown.
   '383-primal':{id:'precipice-blades',name:'Precipice Blades',type:'ground',kind:'nova',desc:'Jagged blades of stone erupt outward in every direction.',cd:2.6,dmg:40,speed:260,count:16,pierce:3,life:1.3,size:16},
   // chains: how many separate lightning chains fire at once (each starts on a different foe).
   '382-primal':{id:'origin-pulse',name:'Origin Pulse',type:'water',kind:'chain',desc:'Four beams of blue light lock on to different foes and arc from foe to foe.',cd:1.4,dmg:16,count:6,radius:230,chains:4}
 };
 // ---- Mega kits (js/mega-kits.js): each Mega's signature move is built from a game move template ----
 const MEGA_KITS=window.PS_MEGA_KITS||{};
 let kitMovesBuilt=false;
 function buildKitMoves(m){
   if(kitMovesBuilt)return;
   for(const [form,kit] of Object.entries(MEGA_KITS)){
     const mv=kit&&kit.move;if(!mv||SIGNATURE_MOVES[form])continue;
     const tpl=m.BY_ID[mv.from];if(!tpl){console.warn('Mega kit: unknown template',mv.from,'for',form);continue;}
     const def={};
     for(const k in tpl){if(['ups','maxLvl','evoMods','evoText','id','name','desc'].includes(k))continue;def[k]=tpl[k];}
     for(const k in mv){if(k!=='from')def[k]=mv[k];}
     def.kind=tpl.kind; // the template decides how the move works
     SIGNATURE_MOVES[form]=def;
   }
   kitMovesBuilt=true;
 }
 function registerSignatureMoves(){
   const m=getBridge()?.moves;
   if(!m||!m.BY_ID||!Array.isArray(m.ALL))return false;
   buildKitMoves(m);
   for(const def of Object.values(SIGNATURE_MOVES)){
     // The engine adds 'ups' (upgrade table) and 'maxLvl' to every move at boot.
     // Moves injected later must get them too, or the level-up reward screen
     // crashes on def.ups[lvl-1] and freezes the game.
     if(!Array.isArray(def.ups)){
       const tpl=m.ALL.find(x=>x!==def&&x.kind===def.kind&&Array.isArray(x.ups));
       def.ups=tpl?tpl.ups:[];
       def.maxLvl=def.ups.length+1;
     }
     if(!m.BY_ID[def.id]){m.ALL.push(def);m.BY_ID[def.id]=def;}
   }
   return true;
 }
 function grantSignature(p,form){
   const def=SIGNATURE_MOVES[form];
   if(!def||!registerSignatureMoves()||typeof p.addMove!=='function')return null;
   if(typeof p.hasMove==='function'&&p.hasMove(def.id))return null;
   const previousMax=Number(p.maxMoves)||4;
   // Bonus slot: the signature move never uses up one of your normal move slots,
   // so it always fits, even with a full move bar.
   p.maxMoves=Math.max(previousMax,p.slots?.length||0)+1;
   const learned=p.addMove(def.id);
   if(learned){
     // Signature moves arrive fully upgraded.
     const m=getBridge()?.moves,inst=p.moves?.find(v=>v.id===def.id);
     if(m&&inst&&typeof m.levelUp==='function'){let guard=20;while(guard-->0&&m.levelUp(inst));}
   }
   if(!learned){
     p.maxMoves=previousMax;
     // Fallback: the game's own "learn this move / choose a move to forget" prompt (pauses the run).
     try{getBridge()?.game?.runTm?.(def.id);}catch(e){console.warn('Primal move prompt:',e);}
     return null;
   }
   return ()=>{
     // Remove the bonus signature slot without altering the normal learned moves.
     const i=p.slots?.findIndex(slot=>Array.isArray(slot)&&slot.some(move=>move.id===def.id))??-1;
     if(i>=0){const slot=p.slots.splice(i,1)[0];for(const move of slot)p.moves=p.moves.filter(v=>v!==move);}
     p.maxMoves=previousMax;
     if(typeof p.arrange==='function')p.arrange();
     if(p.slots?.length)p.active=Math.min(Number(p.active)||0,p.slots.length-1);
   };
 }

 // ---- Primal weather ----
 // Natural weather (rain, sun, sandstorm, snow, fields...) keeps happening normally for the world,
 // but it does NOT affect the Primal player:
 //  - the Primal player's attacks AND the hits they take use only the Primal weather table below,
 //    never the natural weather's numbers (no stacking, no cancelling);
 //  - natural weather chip damage / healing skip the Primal player (engine flag 'primalImmune');
 //  - natural fields (Misty/Electric) don't block the Primal player's burns, stuns, etc.
 // The HUD shows the Primal weather while it is active.
 function weatherApi(){const w=getBridge()?.weather;return w&&w.KINDS&&typeof w.mult==='function'?w:null;}
 let weatherHooked=false;
 function hookWeather(){
   const w=weatherApi();if(!w||weatherHooked)return;
   const nativeMult=w.mult.bind(w),nativeBlocks=typeof w.blocks==='function'?w.blocks.bind(w):()=>false;
   const desc=Object.getOwnPropertyDescriptor(w,'current');
   w.mult=function(type){
     if(activePrimal&&getPlayer()===activePrimal.player){const m=activePrimal.cfg.mult[type];return Number.isFinite(m)?m:1;}
     return nativeMult(type);
   };
   w.blocks=function(what){
     if(activePrimal&&getPlayer()===activePrimal.player)return false;
     return nativeBlocks(what);
   };
   if(desc&&desc.get&&desc.configurable){
     Object.defineProperty(w,'current',{configurable:true,enumerable:true,get(){
       if(activePrimal&&getPlayer()===activePrimal.player){
         const c=activePrimal.cfg,k=w.KINDS[c.kind]||{};
         return {kind:'primal-'+c.kind,name:c.name,hint:c.hint,icon:k.icon,color:k.color||c.ring,tint:k.tint||[0,0,0,0],mult:Object.assign({},c.mult),left:Infinity,t:0,dur:Infinity};
       }
       return desc.get.call(w);
     }});
   }
   weatherHooked=true;
 }
 function startPrimalWeather(p,cfg){
   hookWeather();
   activePrimal={player:p,cfg};
   p.primalImmune=true;
 }
 function keepPrimalWeather(){
   hookWeather();
   if(!activePrimal)return;
   const p=getPlayer();
   if(!p||p!==activePrimal.player){clearPrimal();return;}
   p.primalImmune=true;
   // Keep the signature move at max level (covers the "forget a move" prompt path too).
   const form=Object.keys(WEATHER).find(k=>WEATHER[k]===activePrimal.cfg),def=SIGNATURE_MOVES[form],mv=getBridge()?.moves;
   const inst=def&&p.moves?.find(v=>v.id===def.id);
   if(inst&&mv&&typeof mv.levelUp==='function'&&inst.lvl<(def.maxLvl||1)){let guard=20;while(guard-->0&&mv.levelUp(inst));}
 }
 function clearPrimal(){
   if(!activePrimal)return;
   try{delete activePrimal.player.primalImmune;}catch(e){}
   activePrimal=null;
 }

 // ---- Domain visuals: rain (Kyogre) / harsh UV sunlight (Groudon) ----
 const ring=document.createElement('canvas');ring.id='ps-primal-aura-ring';
 ring.style.cssText='display:none;position:fixed;left:0;top:0;pointer-events:none;z-index:20';
 const fx={drops:[],ripples:[],motes:[],last:0};
 function gameCanvas(){
   return [...document.querySelectorAll('canvas')].filter(c=>c!==ring&&c.width>0).map(c=>({c,r:c.getBoundingClientRect()})).filter(o=>o.r.width>400&&o.r.height>250).sort((a,b)=>b.r.width*b.r.height-a.r.width*a.r.height)[0]||null;
 }
 function domainOnScreen(p){
   const g=gameCanvas(),cam=getBridge()?.camera;if(!g||!p)return null;
   // The camera works in CSS pixels (cam._cw = canvas CSS width), NOT device pixels, so this
   // stays correct on Retina / high-DPI screens where the canvas has more pixels than CSS size.
   const css=cam&&Number(cam._cw)>0?g.r.width/cam._cw:1;
   let x,y,rad;
   if(cam&&typeof cam.left==='function'&&Number.isFinite(cam.scale)){
     x=g.r.left+(p.x-cam.left())*cam.scale*css;
     y=g.r.top+(p.y-cam.top())*cam.scale*css;
     rad=PRIMAL_RADIUS*cam.scale*css;
   }else{x=g.r.left+g.r.width/2;y=g.r.top+g.r.height/2;rad=390;}
   return {x,y,rad,box:g.r};
 }
 function drawPrimalDomain(ts){
   requestAnimationFrame(drawPrimalDomain);
   const p=getPlayer();
   const on=activePrimal&&p===activePrimal.player&&getBridge()?.game?.state==='playing';
   if(!on){if(ring.style.display!=='none')ring.style.display='none';fx.drops.length=fx.ripples.length=fx.motes.length=0;return;}
   const d=domainOnScreen(p);if(!d){ring.style.display='none';return;}
   const dpr=Math.min(2,window.devicePixelRatio||1),W=innerWidth,H=innerHeight;
   if(ring.width!==Math.round(W*dpr)||ring.height!==Math.round(H*dpr)){ring.width=Math.round(W*dpr);ring.height=Math.round(H*dpr);ring.style.width=W+'px';ring.style.height=H+'px';}
   ring.style.display='block';
   const ctx=ring.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
   const dt=Math.min(0.05,fx.last?(ts-fx.last)/1000:0.016);fx.last=ts;const t=ts/1000;
   const {x,y,rad}=d,cfg=activePrimal.cfg;
   // Clip everything to the domain circle and the game area.
   ctx.save();ctx.beginPath();ctx.rect(d.box.left,d.box.top,d.box.width,d.box.height);ctx.clip();
   ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.clip();
   if(cfg.fx==='sun'){
     // Harsh UV sunlight: hot white core, orange haze, violet UV fringe, rotating light shafts.
     const pulse=0.85+0.15*Math.sin(t*2.2);
     let g=ctx.createRadialGradient(x,y,0,x,y,rad);
     g.addColorStop(0,`rgba(255,248,215,${0.22*pulse})`);g.addColorStop(0.45,`rgba(255,170,60,${0.13*pulse})`);
     g.addColorStop(0.85,'rgba(255,110,30,0.08)');g.addColorStop(0.97,`rgba(190,90,255,${0.18*pulse})`);g.addColorStop(1,'rgba(190,90,255,0)');
     ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
     ctx.globalCompositeOperation='lighter';
     for(let i=0;i<10;i++){
       const a=t*0.12+i*Math.PI*2/10,w=0.07+0.03*Math.sin(t*1.3+i);
       ctx.fillStyle=`rgba(255,220,140,${0.05+0.03*Math.sin(t*1.7+i*2)})`;
       ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,rad,a-w,a+w);ctx.closePath();ctx.fill();
     }
     // Heat motes rising.
     while(fx.motes.length<Math.round(rad/7)){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*rad;fx.motes.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,vy:-(25+Math.random()*45),life:1+Math.random()*1.6,t:0,c:Math.random()<0.25?'#d9a3ff':(Math.random()<0.5?'#ffd27a':'#fff2c4')});}
     for(let i=fx.motes.length-1;i>=0;i--){const m=fx.motes[i];m.t+=dt;m.y+=m.vy*dt;m.x+=Math.sin(t*3+i)*8*dt;
       if(m.t>m.life){fx.motes.splice(i,1);continue;}
       ctx.globalAlpha=Math.sin(Math.PI*m.t/m.life)*0.8;ctx.fillStyle=m.c;ctx.fillRect(Math.round(m.x),Math.round(m.y),3,3);}
     ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
   }else{
     // Primordial Sea: dark heavy-rain domain with splash ripples.
     let g=ctx.createRadialGradient(x,y,rad*0.2,x,y,rad);
     g.addColorStop(0,'rgba(20,60,140,0.10)');g.addColorStop(0.8,'rgba(15,45,120,0.18)');g.addColorStop(1,'rgba(80,190,255,0.22)');
     ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
     while(fx.drops.length<Math.round(rad/2.2)){fx.drops.push({x:x-rad+Math.random()*rad*2.4,y:y-rad-Math.random()*rad*2,v:900+Math.random()*400,len:14+Math.random()*12});}
     ctx.strokeStyle='rgba(185,225,255,0.55)';ctx.lineWidth=1.5;ctx.beginPath();
     for(let i=fx.drops.length-1;i>=0;i--){const r=fx.drops[i];r.y+=r.v*dt;r.x-=r.v*0.22*dt;
       if(r.y>y+rad){ if(Math.random()<0.5){const a=Math.random()*Math.PI*2,rr=Math.sqrt(Math.random())*rad*0.95;fx.ripples.push({x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr,t:0});}
         r.x=x-rad+Math.random()*rad*2.4;r.y=y-rad-Math.random()*60;continue;}
       ctx.moveTo(r.x,r.y);ctx.lineTo(r.x+r.len*0.22,r.y-r.len);}
     ctx.stroke();
     for(let i=fx.ripples.length-1;i>=0;i--){const q=fx.ripples[i];q.t+=dt;if(q.t>0.5){fx.ripples.splice(i,1);continue;}
       ctx.strokeStyle=`rgba(200,235,255,${0.6*(1-q.t/0.5)})`;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(q.x,q.y,4+q.t*28,(4+q.t*28)*0.4,0,0,Math.PI*2);ctx.stroke();}
     if(fx.ripples.length>160)fx.ripples.splice(0,fx.ripples.length-160);
   }
   ctx.restore();
   // Domain edge.
   ctx.save();ctx.beginPath();ctx.rect(d.box.left,d.box.top,d.box.width,d.box.height);ctx.clip();
   ctx.strokeStyle=cfg.ring;ctx.globalAlpha=0.55+0.15*Math.sin(t*3);ctx.lineWidth=4;ctx.setLineDash([18,10]);ctx.lineDashOffset=-t*30;
   ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 requestAnimationFrame(drawPrimalDomain);

 // ---- Mega passives: damage hooks used by the engine (app.min.js calls PS_HOOKS.deal / PS_HOOKS.take) ----
 function activeKit(){
   const p=window.PS_MEGA_BRIDGE_V5?.game?.player;
   if(!p||!p.megaKit||p.megaForm!==p.megaKit)return null;
   const k=MEGA_KITS[p.megaKit];return k&&k.passive?{p,P:k.passive}:null;
 }
 window.PS_HOOKS={
   deal(type,target){
     const a=activeKit();if(!a)return 1;const {p,P}=a;
     let m=1;if(P.deal){if(type&&Number.isFinite(P.deal[type]))m*=P.deal[type];if(Number.isFinite(P.deal.all))m*=P.deal.all;}
     if(P.lowHp&&p.maxHp>0&&p.hp/p.maxHp<P.lowHp.below)m*=P.lowHp.deal;
     return m;
   },
   take(type,pl){
     const a=activeKit();if(!a||pl!==a.p)return 1;const {p,P}=a;
     let m=1;if(P.take){if(type&&Number.isFinite(P.take[type]))m*=P.take[type];if(Number.isFinite(P.take.all))m*=P.take.all;}
     if(P.highHp&&p.maxHp>0&&p.hp/p.maxHp>P.highHp.above)m*=P.highHp.take;
     return m;
   }
 };
 let lastKitTick=0;
 function megaKitTick(){
   const now=performance.now(),dt=lastKitTick?Math.min(0.25,(now-lastKitTick)/1000):0;lastKitTick=now;
   const a=activeKit();if(!a||!a.P.regen)return;
   const b=window.PS_MEGA_BRIDGE_V5;if(b?.game?.state!=='playing'||a.p.dead)return;
   if(a.p.hp<a.p.maxHp)a.p.hp=Math.min(a.p.maxHp,a.p.hp+a.p.maxHp*a.P.regen*dt);
 }
 const TYPE_NAME=t=>t.charAt(0).toUpperCase()+t.slice(1);
 function describePassive(P){
   const out=[];
   if(P.deal)for(const [t,v] of Object.entries(P.deal))out.push((t==='all'?'All':TYPE_NAME(t))+' damage ×'+v);
   if(P.take)for(const [t,v] of Object.entries(P.take))out.push(v===0?'Immune to '+TYPE_NAME(t):(t==='all'?'All':TYPE_NAME(t))+' damage taken -'+Math.round((1-v)*100)+'%');
   if(P.regen)out.push('Heals '+(P.regen*100).toFixed(1).replace(/\.0$/,'')+'% HP/s');
   if(P.spd)out.push('Speed ×'+P.spd);
   if(P.lowHp)out.push('Below '+Math.round(P.lowHp.below*100)+'% HP: damage ×'+P.lowHp.deal);
   if(P.highHp)out.push('Above '+Math.round(P.highHp.above*100)+'% HP: damage taken -'+Math.round((1-P.highHp.take)*100)+'%');
   return out.join(' · ');
 }

const getPlayer=()=>{const g=getBridge()?.game;return g?.player||null;};
const elt=(tag,txt)=>{const e=document.createElement(tag);if(txt)e.textContent=txt;return e;};
function start(){
 if(document.getElementById('ps-true-megas'))return;
 const panel=elt('aside');panel.id='ps-true-megas';panel.style.cssText='position:fixed;right:12px;top:100px;z-index:2147483000;background:#101824;color:#f7e4bc;border:2px solid #b89a60;border-radius:8px;padding:12px;width:260px;max-width:calc(100vw - 20px);font:13px/1.45 system-ui,sans-serif;box-shadow:0 4px 18px #000a;';
 const title=elt('strong','MEGA EVOLUTION');title.style.cssText='display:block;font-size:15px;margin-bottom:8px;color:#f2dfa7';
 const status=elt('div');status.style.cssText='white-space:pre-line;margin:8px 0;font-size:12px';
 const select=elt('select');select.style.cssText='display:block;width:100%;padding:7px;margin-bottom:8px;border-radius:7px;background:#172536;color:#fff';
 const btn=elt('button','✦ Mega Evolve');btn.style.cssText='background:#b88a39;color:white;border:0;border-radius:7px;padding:9px 12px;font-weight:bold;cursor:pointer';
 const hint=elt('div');hint.style.cssText='margin-top:8px;color:#d5c39b;font-size:12px';
 const close=elt('button','×');close.style.cssText='position:absolute;top:4px;right:6px;background:none;border:0;color:white;font-size:22px;cursor:pointer';
 const mini=elt('button','✦ Mega');mini.style.cssText='position:fixed;z-index:2147482999;width:66px;height:66px;background:#141c2c;color:#f8eab3;border:3px solid #657a96;border-radius:12px;padding:4px;cursor:pointer;image-rendering:pixelated;font:bold 28px monospace;box-shadow:inset 0 0 0 2px #2c3f59';
 panel.style.display='none';panel.style.pointerEvents='auto';close.onclick=()=>{panel.style.display='none';};mini.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!isRunScreen())return;panel.style.display=panel.style.display==='none'?'block':'none';});
 for(const target of [panel,mini]){
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','touchstart','touchend']){
   target.addEventListener(type,e=>{e.stopPropagation();if(['pointerdown','mousedown','touchstart'].includes(type))e.preventDefault();});
  }
 }
 function resetIfNew(){const p=getPlayer();if(!p)return current;if(p!==current){clearPrimal();rewardPending=false;stoneOwned=false;lastLevel=Number(p?.level||1);if(restore){try{restore();}catch(e){console.warn('Mega restore:',e);}restore=null;}current=p;used=false;}return p;}
 function options(p){return p?(FORM_DATA[String(Number(p.dex))]||[]):[];}
 // Pokemon with several Mega forms (Mewtwo X/Y, Charizard X/Y...): the player picks one in the panel.
 // Default = the first form that has a sprite, so the Pokemon visibly changes.
 const chosenForm={};
 function formFor(p){
   const list=options(p);if(!list.length)return null;
   const pick=chosenForm[String(Number(p.dex))];
   return list.find(f=>f.key===pick)||list.find(f=>f.spr)||list[0];
 }
 function setText(el,t){if(el.textContent!==t)el.textContent=t;}
 // One element per line: the game's translation pass collapses newline characters in text,
 // so plain '\n' line breaks in a single text block were shown as one long paragraph.
 function setLines(el,lines){
   const key=lines.join('\u0001');if(el.__lines===key)return;el.__lines=key;
   el.textContent='';
   for(const l of lines){const d=document.createElement('div');if(l.trim())d.textContent=l;else d.style.height='6px';el.appendChild(d);}
 }
 const formsBox=elt('div');formsBox.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:6px 0';
 function renderForms(p,list,f0){
   const sig=(p?p.dex:'')+'|'+(f0?f0.key:'')+'|'+used+'|'+list.length;
   if(formsBox.__sig===sig)return;formsBox.__sig=sig;
   formsBox.innerHTML='';formsBox.style.display=list.length>1?'flex':'none';
   if(list.length<2)return;
   for(const f of list){
     const b=elt('button',(f.en||f.name).replace(/^Mega /,'')+(f.spr?'':' \u00b7 no sprite'));b.type='button';
     const on=f0&&f.key===f0.key;
     b.style.cssText='flex:1 1 45%;padding:6px 8px;border-radius:7px;cursor:pointer;font:bold 12px system-ui;border:2px solid '+(on?'#ffd267':'#3b4d66')+';background:'+(on?'#5a4220':'#172536')+';color:#fff';
     b.disabled=used;if(used&&!on)b.style.opacity='.4';
     b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(used)return;chosenForm[String(Number(p.dex))]=f.key;refresh();});
     formsBox.appendChild(b);
   }
 }
 function isRunScreen(){
   const b=getBridge(),p=b?.game?.player;
   const menu=document.getElementById('scr-menu');
   return !!p && !!b?.game && b.game.state==='playing' && (!menu || menu.classList.contains('hidden'));
 }
 function refresh(){
 registerSignatureMoves();
 const p=resetIfNew();const b=getBridge();const list=options(p);allowMegaByLevel(p,list);
 const f0=formFor(p);
 const primal=!!f0&&!!WEATHER[f0.key];
 setText(title,primal?'PRIMAL REVERSION':'MEGA EVOLUTION');
 setText(btn,primal?'✦ Primal Reversion':'✦ Mega Evolve');
 renderForms(p,list,f0);
 const visible=isRunScreen();
 mini.style.display=visible?'block':'none';
 if(!visible)panel.style.display='none';
 setLines(status,(!b?'Waiting for game bridge…':!p?'Start a run to see Mega forms.':`Pokémon: #${p.dex}\nLevel: ${p.level||1}\nMega: ${used?'ACTIVE / already used':list.length?'available':'no Mega for this Pokémon'}`+(f0?'\nForm: '+(f0.en||f0.name)+(f0.spr?'':' (no sprite yet: keeps the normal look)'):'')+(f0&&MEGA_KITS[f0.key]?'\n\nPassive \u2013 '+MEGA_KITS[f0.key].passive.name+':\n'+describePassive(MEGA_KITS[f0.key].passive)+'\nSignature move: '+MEGA_KITS[f0.key].move.name+' (max level)\n'+(MEGA_KITS[f0.key].move.desc||''):'')).split('\n'));

 // Species is fixed to the current player; no clickable Pokémon/form selector.


 const enabled=!!p&&list.length>0&&!used&&stoneOwned&&(p.level||1)>=10;
 mini.style.background=stoneOwned&&!used?'#755221':'#141c2c';
 mini.style.borderColor=stoneOwned&&!used?'#ffd267':'#657a96';
 // Only rebuild the icon when it changes: replacing it every tick swallowed clicks
 // (a click needs press + release on the same element), so the button took many clicks.
 const miniHtml=(primal ? orbIcon(Number(p?.dex)===383,40) : megaIcon(f0,stoneOwned))+(primal?'<span style="display:block;font:bold 9px monospace;color:#ffe5a4;line-height:1">PRIMAL</span>':'');
 if(mini.__html!==miniHtml){mini.innerHTML=miniHtml;mini.__html=miniHtml;}
 mini.title=primal?(stoneOwned&&!used?'Primal Orb obtained. Activate Primal Reversion.':'Primal HUD slot'):(stoneOwned&&!used?'Mega Stone obtained. Activate Mega Evolution.':'Mega Stone HUD slot');
  mini.setAttribute('aria-label',primal?'Primal Reversion':'Mega Evolution');
 btn.disabled=!enabled;btn.style.opacity=enabled?'1':'.45';
 hint.textContent=!p?'Start a run first.':used?'Mega Evolution active until the run ends.':!list.length?'No Mega form for this Pokémon.':(p.level||1)<10?'Available from level 10.':stoneOwned?'Mega Stone obtained! Finish your reward selection, then activate your Mega form.':rewardPending?'A Mega Stone reward card is available in the level-up rewards.':'50% Mega Stone test chance on each eligible level-up.';
 }
 btn.onclick=()=>{
 const p=resetIfNew();const list=options(p);const f=formFor(p);const b=getBridge();
 if(!p||!f||used||!b?.sprites||(p.level||1)<10||!stoneOwned){refresh();return;}
 if(b.game?.state!=='playing'){hint.textContent='Finish your current reward or menu first, then open Mega Stone Ready again.';return;}
 const baseline={mon:p.mon,anim:p.anim,baseAtk:p.baseAtk,baseSpd:p.baseSpd,baseSpa:p.baseSpa,maxHp:p.maxHp,hp:p.hp,r:p.r,bodyH:p.bodyH};
 try{
   // Register source SpriteCollab geometry so the native game animator can load Mega sheets.
   if(f.spr&&SPRITE_META[f.key])b.spriteMeta[f.key]=SPRITE_META[f.key];
   const oldMon=p.mon||{};
   p.mon={...oldMon,name:f.en||f.name,types:f.types,mega:f.key};
   if(Number.isFinite(f.atk)&&Number.isFinite(Number(oldMon.atk))&&Number(oldMon.atk)>0)p.baseAtk=baseline.baseAtk*(f.atk/oldMon.atk);
   if(Number.isFinite(f.spd)&&Number.isFinite(Number(oldMon.spd))&&Number(oldMon.spd)>0)p.baseSpd=baseline.baseSpd*(f.spd/oldMon.spd);
   if(Number.isFinite(f.spa)&&Number.isFinite(baseline.baseSpa)&&Number(oldMon.spa)>0)p.baseSpa=baseline.baseSpa*(f.spa/oldMon.spa);
   if(Number.isFinite(f.hp)&&Number.isFinite(Number(oldMon.hp))){const increase=Math.round(f.hp-oldMon.hp);p.maxHp=Math.max(1,baseline.maxHp+increase);p.hp=Math.min(p.maxHp,baseline.hp+Math.max(0,increase));}
   if(f.spr&&SPRITE_META[f.key]){
     p.anim=new b.sprites.Animator(f.key,Number(p.scale)||1,Boolean(p.shiny||p.isShiny||p.anim?.shiny));
     if(typeof b.sprites.playerRadius==='function')p.r=b.sprites.playerRadius(f.key);
     if(typeof b.sprites.bodyHeight==='function')p.bodyH=b.sprites.bodyHeight(f.key);
   }
   if(WEATHER[f.key]){
     // Primal stats: multipliers relative to the stats right before transforming (see PRIMAL_BALANCE).
     const B=PRIMAL_BALANCE;
     if(Number.isFinite(baseline.baseAtk))p.baseAtk=baseline.baseAtk*B.atk;
     if(Number.isFinite(baseline.baseSpa))p.baseSpa=baseline.baseSpa*B.spa;
     if(Number.isFinite(baseline.baseSpd))p.baseSpd=baseline.baseSpd*B.spd;
     if(Number.isFinite(baseline.maxHp)){
       p.maxHp=Math.max(1,Math.round(baseline.maxHp*B.hp));
       p.hp=Math.min(p.maxHp,baseline.hp+(p.maxHp-baseline.maxHp));
     }
     // Hitbox is left at the sprite's own size (a bigger hitbox would just make you easier to hit).
     if(Number.isFinite(baseline.bodyH))p.bodyH=Math.max(p.bodyH||0,baseline.bodyH*1.45);
   }
   const undoSignature=grantSignature(p,f.key);
   const kit=MEGA_KITS[f.key];
   if(kit&&kit.passive){p.megaKit=f.key;if(Number.isFinite(kit.passive.spd)&&Number.isFinite(p.baseSpd))p.baseSpd*=kit.passive.spd;}
   p.megaForm=f.key;used=true;rewardPending=false;stoneOwned=false;
   if(WEATHER[f.key])startPrimalWeather(p,WEATHER[f.key]);
   restore=()=>{if(undoSignature)undoSignature();delete p.megaKit;clearPrimal();p.mon=baseline.mon;p.anim=baseline.anim;p.baseAtk=baseline.baseAtk;p.baseSpd=baseline.baseSpd;if(Number.isFinite(baseline.baseSpa))p.baseSpa=baseline.baseSpa;p.maxHp=baseline.maxHp;p.hp=Math.min(p.hp,baseline.maxHp);p.r=baseline.r;p.bodyH=baseline.bodyH;delete p.megaForm;};
   hint.textContent=WEATHER[f.key]?'Primal Reversion! '+WEATHER[f.key].name+' is active.'+(undoSignature?' Learned '+SIGNATURE_MOVES[f.key].name+'!':''):'Mega Evolution activated!'+(kit?' Passive: '+kit.passive.name+'.':'')+(undoSignature?' Learned '+SIGNATURE_MOVES[f.key].name+'!':'');
 }catch(err){clearPrimal();console.error('Mega Evolution:',err);p.mon=baseline.mon;p.anim=baseline.anim;p.baseAtk=baseline.baseAtk;p.baseSpd=baseline.baseSpd;p.maxHp=baseline.maxHp;p.hp=baseline.hp;p.r=baseline.r;p.bodyH=baseline.bodyH;hint.textContent='Mega error: '+err.message;}
 refresh();
 };

 function orbIcon(red,size){
   // Pixel-art Red Orb (Groudon) / Blue Orb (Kyogre), drawn inline so no image files are needed.
   const c=red?['#7a1414','#d42a2a','#ff7a5a']:['#123a7a','#2a6ad4','#7ac8ff'];
   return `<svg viewBox="0 0 16 16" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="pointer-events:none"><rect x="5" y="1" width="6" height="1" fill="${c[0]}"/><rect x="3" y="2" width="10" height="2" fill="${c[0]}"/><rect x="2" y="4" width="12" height="8" fill="${c[0]}"/><rect x="3" y="12" width="10" height="2" fill="${c[0]}"/><rect x="5" y="14" width="6" height="1" fill="${c[0]}"/><rect x="4" y="3" width="8" height="10" fill="${c[1]}"/><rect x="3" y="5" width="10" height="6" fill="${c[1]}"/><rect x="5" y="4" width="3" height="2" fill="${c[2]}"/><rect x="5" y="4" width="1" height="1" fill="#fff"/><rect x="7" y="7" width="2" height="2" fill="${c[0]}"/></svg>`;
 }
 function megaIcon(form,owned){
   // Pixel-art Keystone icon, with a gem colored for the chosen Mega form.
   const gem= form?.key?.startsWith('282-')?'#f9a9bb':form?.key?.startsWith('448-')?'#6fb4ff':'#efdca1';
   return `<svg viewBox="0 0 48 48" width="44" height="44" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect x="20" y="1" width="8" height="5" fill="#ddd5b1"/><rect x="14" y="6" width="20" height="4" fill="#a88a52"/><rect x="10" y="10" width="28" height="28" fill="#a88a52"/><rect x="14" y="14" width="20" height="20" fill="#1a263b"/><rect x="20" y="16" width="8" height="16" fill="${gem}"/><rect x="16" y="20" width="16" height="8" fill="${gem}"/><rect x="22" y="18" width="4" height="4" fill="#fff"/><rect x="14" y="38" width="20" height="4" fill="#a88a52"/><rect x="20" y="42" width="8" height="5" fill="#ddd5b1"/></svg>`;
 }
 function placeHudSlot(){
   if(!isRunScreen())return;
   const canvas=[...document.querySelectorAll('canvas')].filter(el=>{const r=el.getBoundingClientRect();return r.width>400&&r.height>250;}).sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];
   if(!canvas){mini.style.right='12px';mini.style.top='105px';return;}
   const r=canvas.getBoundingClientRect();
   mini.style.top=Math.round(r.top+Math.min(62,r.height*.07))+'px';
   mini.style.left=Math.round(Math.max(6,Math.min(window.innerWidth-73,r.left+r.width*.72)))+'px';
 }
 const levelMenu=document.getElementById('scr-levelup');
 const cards=document.getElementById('cards');
 function drawMegaReward(){
   if(!cards||!levelMenu)return;
   const showing=!levelMenu.classList.contains('hidden')&&getBridge()?.game?.player;
   const existing=document.getElementById('ps-mega-level-card');
   if(!showing||!rewardPending||stoneOwned||used){existing?.remove();return;}
   if(existing)return;
   const p=getPlayer(),f=formFor(p);if(!f)return;
   const card=elt('button');card.id='ps-mega-level-card';card.type='button';card.className='card';
   card.style.cssText='border:2px solid #e8c96b;border-radius:12px;background:#182234;color:#fff4ce;min-height:142px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;cursor:pointer;';
   const primalReward=!!WEATHER[f.key];
   const rewardLabel=primalReward?(Number(p.dex)===382?'Blue Orb':'Red Orb'):'Mega Stone';
   card.innerHTML=(primalReward?orbIcon(Number(p.dex)===383,64):megaIcon(f,true).replace('width="44" height="44"','width="64" height="64"'))+'<b>'+rewardLabel+'</b><small>Claim '+(primalReward?'Primal Orb':'Mega Stone')+' (50% test)</small>';
   card.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();stoneOwned=true;rewardPending=false;card.remove();refresh();});
   cards.appendChild(card);
 }

 panel.append(title,status,formsBox,btn,hint,close);document.body.append(mini,panel,ring);setInterval(()=>{refresh();placeHudSlot();drawMegaReward();keepPrimalWeather();megaKitTick();},60);refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
// ================= CUSTOM ACCOUNT SKINS =================
// Gives specific accounts their own optional sprite for a Pokemon. Only that account sees it.
//   username (lowercase)  ->  { dex number : { key: sprite folder in assets/pokemon/, ... } }
// 'anims' lists the sheets that exist in the skin folder. Any animation NOT listed (Attack, Shoot,
// Charge, Hurt, Faint) plays the skin's Idle frames, so the skin is always visible while ON.
// 'res': sheets are drawn at this many times normal resolution (4 = 512x1280 sheet, 128x160/frame).
// A toggle button appears in the main menu (next to the partner's Upgrades button) ONLY for that
// account. OFF = the normal sprite exactly as the game draws it (shiny stays shiny).
// Mega/Primal forms always keep their own sprites.
(function(){
 const SKINS={
   'lovergare':{'282':{key:'282-lovergare',label:'Bikini Gardevoir',icon:'\u{1F459}',anims:['Idle','Walk'],res:4}} // Bikini Gardevoir
 };
 const bridge=()=>window.PS_MEGA_BRIDGE_V5;
 const user=b=>String(b?.user||'').trim().toLowerCase();
 const prefKey=(u,dex)=>'ps-skin:'+u+':'+dex;
 function isOn(u,dex){try{return localStorage.getItem(prefKey(u,dex))!=='off';}catch(e){return true;}} // default ON
 function setOn(u,dex,on){try{localStorage.setItem(prefKey(u,dex),on?'on':'off');}catch(e){}}
 function skinFor(b,p){
   const u=user(b),map=SKINS[u];if(!map||!p||p.megaForm)return null;
   const dex=String(Number(p.dex)),skin=map[dex];
   return skin&&isOn(u,dex)?skin:null;
 }
 function ensureMeta(b,skin,dex){
   if(b.spriteMeta[skin.key])return true;
   const base=b.spriteMeta[dex];if(!base)return false;
   const meta=JSON.parse(JSON.stringify(base));delete meta.sh;delete meta.sa; // skin has no shiny variant
   for(const a of Object.keys(meta.a||{}))if(!skin.anims.includes(a))delete meta.a[a]; // unlisted -> Idle
   const k=Number(skin.res)||1;
   if(k!==1)for(const a of Object.values(meta.a||{})){a.w*=k;a.h*=k;a.ax*=k;a.ay*=k;}
   b.spriteMeta[skin.key]=meta;return true;
 }
 function apply(){
   const b=bridge(),p=b?.game?.player;
   if(!b||!p||!b.sprites?.Animator||!b.spriteMeta)return;
   const dex=String(Number(p.dex)),skin=skinFor(b,p),isSkinned=!!p.__skin&&p.anim&&p.anim.dex===p.__skin.key;
   if(skin){
     if(isSkinned&&p.__skin.key===skin.key)return;
     if(!ensureMeta(b,skin,dex))return;
     // Remember the real sprite settings (scale, shiny) so OFF restores them exactly.
     const prev=isSkinned?p.__skin.prev:{scale:Number(p.anim?.scale)||Number(p.scale)||1,shiny:!!p.anim?.shiny};
     try{p.anim=new b.sprites.Animator(skin.key,prev.scale/(Number(skin.res)||1),false);p.__skin={key:skin.key,prev};}catch(e){console.warn('Skin:',e);}
   }else if(isSkinned){
     const prev=p.__skin.prev;
     try{p.anim=new b.sprites.Animator(p.megaForm||dex,prev.scale,prev.shiny);}catch(e){console.warn('Skin off:',e);}
     delete p.__skin;
   }
 }
 // ---- menu toggle (only for accounts that own a skin) ----
 let btn=null;
 function menuButton(){
   const b=bridge(),u=user(b),map=SKINS[u];
   const anchor=document.getElementById('menu-partner-upg');
   if(!map||!anchor){if(btn)btn.style.display='none';return;}
   // Which partner is shown in the menu? Use the run's Pokemon if any, else the first skinned dex.
   const dex=Object.keys(map)[0],skin=map[dex];
   if(!btn){
     btn=document.createElement('button');btn.type='button';btn.className='pp-upg';btn.id='ps-skin-toggle';
     btn.style.marginLeft='6px';
     btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const d=btn.dataset.dex;setOn(user(bridge()),d,!isOn(user(bridge()),d));render();apply();});
   }
   if(btn.parentNode!==anchor.parentNode||btn.previousSibling!==anchor)anchor.insertAdjacentElement('afterend',btn);
   btn.dataset.dex=dex;btn.style.display='';
   function render(){const on=isOn(user(bridge()),btn.dataset.dex);btn.textContent=skin.icon+' '+skin.label+': '+(on?'ON':'OFF');btn.style.opacity=on?'1':'.6';btn.title='Only visible on your account';}
   render();
 }
 setInterval(()=>{apply();menuButton();},250);
})();
