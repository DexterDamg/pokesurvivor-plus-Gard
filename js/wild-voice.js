/* Authored species dialogue. Missing entries are deliberately silent. */
(() => {
 const E=()=>window.PS_HOOPA_ENGINE;
 const lines={
 383:{start:"I'm Groudon, the embodiment of land! I raise the ground and clear away rain clouds!",battle:"The land beneath your feet answers to me!",low:"The earth will endure. So will I.",water:"Water. Disgusting! I will drive it back and raise dry land in its place!"},
 382:{start:"I am Kyogre. The oceans rise with my awakening.",battle:"You stand against the tide itself.",low:"The deepest sea has yet to reveal its strength."},
 384:{start:"I am Rayquaza. From the skies, I watch over the balance of this world.",battle:"Enough! Your conflict ends beneath my wings."},
 150:{start:"I am Mewtwo. My power is mine to command. My purpose is mine to choose.",battle:"You would test the limits of my mind?",low:"I was not made to surrender."},
 151:{start:"Mew! There's so much here to explore!",battle:"Can you keep up with me?"},
 483:{start:"I am Dialga. Each passing moment carries the force of time.",battle:"Your advance stops here."},
 484:{start:"I am Palkia. Space bends at my command.",battle:"There is no distance beyond my reach."},
 487:{start:"I am Giratina. Beyond this world lies my domain.",battle:"Face the power that waits on the other side."},
 493:{start:"I am Arceus. Let the strength of your spirit reveal itself.",battle:"Your actions shall meet their judgment."},
 480:{start:"I am Uxie. Knowledge reveals what strength alone cannot.",battle:"Observe carefully. Every attack has an opening."},
 481:{start:"I am Mesprit. I can feel the resolve that brought us here.",battle:"I will protect the bonds we share."},
 482:{start:"I am Azelf. Stand firm. Our will must not break.",battle:"We choose to keep fighting!"},
 25:{start:"Pikachu! I'll keep my sparks ready.",battle:"One clear opening. That's all I need!"},
 6:{start:"Charizard. My flame is burning strong. Let's take to the field.",battle:"I'll meet you with fire and claw!"},
 9:{start:"Blastoise. Cannons ready. I'll hold the line.",battle:"Brace yourself for the next volley!"},
 3:{start:"Venusaur. Sunlight and steady roots will see us through.",battle:"The ground is already taking root around you."},
 448:{start:"I am Lucario. Your aura tells me more than words can.",battle:"I can sense your next move."},
 94:{start:"Gengar. Keep an eye on your shadow.",battle:"Too late. I was behind you."},
 249:{start:"I am Lugia. I keep my strength beneath the waves until it is needed.",battle:"Do not mistake restraint for weakness."},
 250:{start:"I am Ho-Oh. Let this journey be worthy of the light we carry.",battle:"My sacred flame will decide this battle."},
 646:{start:"I am Kyurem. The cold within me will not be denied.",battle:"All warmth fades before this ice."},
 643:{start:"I am Reshiram. I will burn a path toward truth.",battle:"Face the truth within these flames."},
 644:{start:"I am Zekrom. I carry the thunder of an unbroken ideal.",battle:"Show me the conviction behind your ideals."},
 530:{start:"Excadrill. These claws will carve our way forward.",battle:"I'll break through their defenses!"},
 529:{start:"Drilbur. I'll find our footing, one tunnel at a time.",battle:"There's always a way through."}
 };
 const who=w=>{const d=E()?.DEX_BY?.[Number(w?.dex)]||{};return {name:d.name||w?.name||w?.mon?.name||'Pokemon',types:d.types||w?.types||['normal'],nature:'',voice:'authored'};};
 function line(w,sit){const d=lines[Number(w?.dex)];if(!d)return ['normal','',''];const key=/water/.test(sit)?'water':/start|intro/.test(sit)?'start':/low|hurt/.test(sit)?'low':/boss|legend|spotPlayer/.test(sit)?'battle':null;return [key==='water'?'angry':'determined',d[key]||'',key==='water'?'anger':''];}
 window.PS_VOICE={who,line,legendLine:line,bubble:()=>'',reply:()=>['normal','',''],chat:()=>({lines:[],outcome:null}),relation:()=>null,isLegend:w=>!!(w?.boss||w?.legend),title:()=>'',rivalOf:()=>null,rivalLine:()=>null,label:()=>'',explorer:()=>who(E()?.Game?.player),run:{kills:0,harmless:0},natures:[],voices:[],catalog:lines};
})();
