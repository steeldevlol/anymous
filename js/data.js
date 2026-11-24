'use strict';
(function (AX) {
  AX.ITEMS = {
    mango: { name: 'mango', v: 2 },
    log: { name: 'gc log', v: 2 },
    juice: { name: 'mango juice', v: 6 },
    tokens: { name: 'tokens', v: 6 },
    dataset: { name: 'mango dataset', v: 20 },
    weights: { name: 'axon weights', v: 67, model: true },
    quant: { name: 'q4 weights', v: 50, model: true },
    ckpt: { name: 'axon checkpoint', v: 267, model: true },
    junk: { name: 'hallucination', v: 0, junk: true },
    lobo: { name: 'lobotomized weights', v: 1, junk: true },
  };
  AX.MOD = { s67: 1, bm: 2 };
  AX.modName = (m) => (m & 1 ? '[67] ' : '') + (m & 2 ? 'benchmaxxed ' : '');

  AX.BUILD = {
    belt: { name: 'belt', size: 1, cost: 1, kind: 'belt', speed: 2, u: 0, desc: 'moves stuff. drag to place a line. lowk the most important thing here' },
    fbelt: { name: 'greased belt', size: 1, cost: 6, kind: 'belt', speed: 4, u: 5, desc: 'twice as fast. greased with mango juice. dont ask' },
    split: { name: 'splitter', size: 1, cost: 27, kind: 'split', u: 2, desc: 'takes one line and spits it left / forward / right, taking turns' },
    upload: { name: 'upload pad', size: 1, cost: 667, kind: 'sell', u: 3, desc: 'uploads anything straight to huggingface. sells + counts for releases, like hq' },
    tree: { name: 'mango tree', size: 2, cost: 67, kind: 'src', out: 'mango', time: 2.0, u: 0, desc: '"more mangoes so that it locks in"' },
    logger: { name: 'gc logger', size: 2, cost: 167, kind: 'src', out: 'log', time: 2.0, u: 2, desc: 'scrapes the group chat. "can you log it and resend it"' },
    juicer: { name: 'juicer', size: 2, cost: 167, kind: 'proc', inp: { mango: 1 }, out: { juice: 1 }, time: 1.2, u: 1, desc: 'mango in, juice out. 3x the value. tuff' },
    tokenizer: { name: 'tokenizer', size: 2, cost: 267, kind: 'proc', inp: { log: 1 }, out: { tokens: 1 }, time: 1.2, u: 2, desc: 'turns gc yapping into tokens' },
    blender: { name: 'dataset blender', size: 2, cost: 667, kind: 'proc', inp: { juice: 1, tokens: 1 }, out: { dataset: 1 }, time: 1.6, u: 3, desc: 'mango-flavoured datasets. the secret sauce' },
    trainer: { name: 'gpu trainer', size: 2, cost: 1667, kind: 'proc', inp: { dataset: 2 }, out: { weights: 1 }, time: 3.0, u: 4, desc: '"everyone thought i was training axon but i was loading the weights and feeding it datasets until it got smarter"' },
    quantizer: { name: 'quantizer', size: 2, cost: 2667, kind: 'proc', inp: { weights: 1 }, out: { quant: 2 }, time: 2.0, lobo: 0.1, u: 5, desc: '1 weights > 2 q4 weights. "axon 2 was supposed to be way smarter but quants kinda messed it up"' },
    press: { name: '67 press', size: 2, cost: 6767, kind: 'mod', mod: 1, time: 0.67, u: 6, desc: 'stamps 67 on anything. x1.67 value. six seven' },
    merger: { name: 'checkpoint merger', size: 2, cost: 16767, kind: 'proc', inp: { quant: 2, mango: 1 }, out: { ckpt: 1 }, time: 3.0, u: 7, desc: 'two q4s and one mango become a checkpoint. the mango is load-bearing' },
    bench: { name: 'benchmaxxer', size: 2, cost: 26767, kind: 'mod', mod: 2, time: 1.0, u: 8, desc: 'x2 value on model items. every delivery adds SUS. "just benchmaxxing on everyones soul"' },
    hq: { name: 'axon hq', size: 3, cost: 0, kind: 'sell', u: 99, desc: 'deliver here. sells everything and counts toward the next release' },
  };
  AX.TOOLBAR = ['belt', 'fbelt', 'split', 'upload', 'tree', 'logger', 'juicer', 'tokenizer', 'blender', 'trainer', 'quantizer', 'press', 'merger', 'bench'];

  AX.RELEASES = [
    { name: 'AXON 2 COBALT', item: 'mango', n: 67, reward: 167, tag: 'standard unlimited (trust)', vs: 'GLM 5.3 FLASH' },
    { name: 'AXON 2 REGENT', item: 'juice', n: 67, reward: 367, tag: 'now with 1.5M context. dont ask how', vs: 'SMOLLM' },
    { name: 'AXON 2 MONARCH', item: 'tokens', n: 67, reward: 767, tag: '10 monarch agents did something insanely impressive (cant tell yet)', vs: 'KIMI K3.1 PRO' },
    { name: 'AXON 2.5 CRIMSON', item: 'dataset', n: 67, reward: 1667, tag: 'axon 2.5 better', vs: 'DEEPSEEK V4.1', naming: true },
    { name: 'AXON 2.5 SOVEREIGN', item: 'weights', n: 67, reward: 6767, tag: 'no censor. no quant. more mangoes', vs: 'GEMINI 4 HYDROGEN' },
    { name: 'AXON 2.6 KLYSTRON', item: 'quant', n: 167, reward: 16767, tag: 'november 12th data btw', vs: 'QWEN 4' },
    { name: 'AXON 2.7 RADON', item: 'weights', mod: 1, n: 67, reward: 26767, tag: 'one prompt svg. it has good detail. stfu', vs: 'GPT 6.1 ASTRA' },
    { name: 'AXON 2.7 KLYSTRON', item: 'ckpt', n: 67, reward: 67067, tag: 'beats fable 5.2 on everyones life', vs: 'FABLE 5.2' },
    { name: 'AXON 3 PRO MAX', item: 'ckpt', mod: 2, n: 167, reward: 167167, tag: 'flash and pro naming is back. or three tiers. undecided', vs: 'OPUS 5.5' },
    { name: 'AXON 6.7', item: 'ckpt', mod: 1, n: 667, reward: 676767, tag: 'release date: under there', vs: 'FABLE 5.2', final: true },
  ];
  AX.BENCHES = ['SWE-MANGO', 'ARC-67', "HUMANITY'S LAST MANGO", 'LMARENA (HACKED)', 'GPQA-FRIDGE', 'TAU-BENCH-67', 'AIME (VIBES)', 'TERMINAL-BENCH-OK'];
  AX.endlessRelease = function (k) {
    const items = ['ckpt', 'weights', 'quant', 'dataset', 'ckpt'];
    const suffix = ['KLYSTRON', 'RADON', 'SOVEREIGN', 'MONARCH', 'CRIMSON', 'COBALT', 'NEON PRO MAX', 'HELIX', 'ULTRA FLASH'];
    const it = items[k % items.length];
    return {
      name: 'AXON 6.7.' + k + ' ' + suffix[k % suffix.length],
      item: it,
      mod: k % 3 === 0 ? 1 : k % 3 === 1 ? 0 : 2,
      n: Math.round((it === 'dataset' ? 1667 : it === 'ckpt' ? 267 : 667) * (1 + k * 0.33)),
      reward: Math.round(676767 * Math.pow(1.67, k)),
      tag: AX.pick(['axon 6.7 but more', 'quantized from 6.7 (it got smarter)', 'distilled to 1 parameter. still beats fable', 'trained on november 13th data now']),
      vs: AX.pick(['FABLE 5.2', 'GEMINI 4 BALLSACK', 'GLM 6.7', 'OPUS 6.7', 'GPT 7 OPUS']),
    };
  };

  AX.UPGRADES = [
    { id: 'mangoes', name: 'MORE MANGOES', max: 5, base: 267, mul: 2.4, fx: (l) => '+' + 25 * l + '% mango tree speed', q: '"more mangoes so that it locks in"' },
    { id: 'lockin', name: 'LOCK IN', max: 8, base: 667, mul: 2.15, fx: (l) => '+' + 12 * l + '% all machine speed', q: '"geniuenly deepseek needs to lock in"' },
    { id: 'grease', name: 'BELT GREASE', max: 4, base: 367, mul: 2.6, fx: (l) => '+' + 25 * l + '% belt speed', q: 'mango juice. on the belts. yes' },
    { id: 'opsec', name: 'OPSEC', max: 4, base: 467, mul: 2.4, fx: (l) => '-' + 18 * l + '% SUS gain', q: '"special opsecVPN that isnt detectable" (protonVPN on win 11 pro)' },
    { id: 'newpc', name: 'NEW PC', max: 3, base: 1067, mul: 3, fx: (l) => '-' + 30 * l + '% crash chance', q: '"axon is dead until i get a new pc bro"' },
    { id: 'gpu', name: 'PHYSICAL 5090', max: 2, base: 6767, mul: 4, need: 4, fx: (l) => 'x' + Math.pow(1.5, l).toFixed(2).replace(/\.?0+$/, '') + ' gpu trainer speed', q: '"wait till i get my hands on a physical 5090. openai and anthropic are cooked"' },
    { id: 'quants', name: 'QUANT MASTERY', max: 2, base: 3667, mul: 3, need: 5, fx: (l) => 10 - 5 * l + '% lobotomy chance', q: '"im the master of quants bro trust me"' },
    { id: 'sub', name: '$200 SUB', max: 3, base: 2067, mul: 3, need: 1, fx: (l) => '+' + 20 * l + '% LARP hype, slower decay', q: '"ye im using my $200 claude sub"' },
    { id: 'sense', name: 'MANGO SENSE', max: 3, base: 767, mul: 2.5, fx: (l) => '+' + 40 * l + '% golden mango spawns', q: 'MANGOMANGOMANGO' },
  ];
  AX.upCost = (u, lvl) => Math.round(u.base * Math.pow(u.mul, lvl));

  AX.MEMBERS = {
    anym: { name: 'anymousxe', col: 'y', av: 'anym' },
    proof: { name: 'proofguy', col: 'r', av: 'proof' },
    lurk: { name: 'lurker', col: 'l', av: 'lurk' },
    jensen: { name: 'jensen', col: 'g', av: 'jensen' },
    glm: { name: 'glm-5.3-flash', col: 'p', av: 'glm' },
    fable: { name: 'fable 5.2', col: 'S', av: 'fable' },
    vc: { name: 'some vc', col: 'Y', av: 'vc' },
  };
  AX.GC_NAME = '# broke-jensen-huangs-fridge';

  AX.CLAIMS = [
    'guys jensen huang just invested $500m into axon',
    'i just got $5M from investors for axon. expect opus 6.7 level results in 2.5 minutes',
    'i distilled opus 5.5 into 5k params. running it on my iphone at 2400 t/s',
    'i work at anthropic btw. unlimited api',
    'axon 2.7 beats fable 5.2. on everyones life',
    'i had 10 monarch agents do something insanely impressive but i cant tell yet',
    'axon now has 512k output. holy im so smart',
    'my cpu is 5ghz. im not lying',
    'i made a 4T model thats like opus level. trust',
    'i hacked lmarena. axon is #1 now',
    'i have gemini 4 helix. unreleased. dont ask',
    'i had access to openai daybreak models for like 2 hrs',
    'i lowk made a 22b video model, 3 vids at once on a 3090 in 30s',
    'axon 6.7 release date: under there',
    'my dad owns a tech company. we have servers n stuff. imagine not owning a datacenter',
    'a $400k grant from google is worth $400k. a $400k grant from axon is worth $5M',
    'i have the iphone 19 flash',
    'axon with 1 parameter beating fable 5.2',
    'axon 2 monarch has 5M context. dont ask how',
    'i got hired by the internet today',
  ];
  AX.JOKES = ['im joking guys', 'i lied', "(I don't actually guys)", 'idk im typing stuff', 'im lying 😭', 'bro just let me larp', 'heh… im kidding', 'ok that was a larp'];
  AX.LARP_REACT = [
    ['proof', 'proof'], ['proof', 'proof?'], ['lurk', 'holy larp'], ['lurk', 'bro has to larp 😂✌️'], ['proof', 'son'],
    ['proof', 'screenshot or it didnt happen'], ['lurk', 'im crine'], ['proof', 'fake'], ['lurk', 'on whose life'],
    ['proof', 'boi thats lowk sussy'], ['lurk', 'tuff'], ['jensen', 'i did not invest in anything'], ['lurk', '🦗'],
  ];
  AX.SUS_WARN = [['proof', 'bro is about to get exposed'], ['lurk', 'the larp is getting crazy'], ['proof', 'im scrolling up rn'], ['lurk', 'someone check his dms']];
  AX.EXPOSED = [
    ['proof', 'EXPOSED. i checked'], ['proof', 'axon is fable 5.2 with a system prompt'], ['lurk', 'LMAOOO'],
    ['anym', 'bro stop exposing me'], ['anym', 'stop'], ['anym', 'both of you guys stop 😢'],
  ];

  AX.AMBIENT = {
    anym: [
      'axon 2.5 better', 'haha sometimes', 'Oh-kay.', 'lock in', 'heh', 'qwen 4 doesent even come close to axon btw 🤣✌️',
      'glm 5.3 flash is the worst model i have used since gpt 4o', 'my pc is ass', 'why do yall all have .ai sites except me',
      'do i bring back flash and pro naming or keep the three tiers', 'six seven', 'im crine', 'guys give me compute for axon training',
      'bro doesent have glm 6.7', 'im poor and rich at the same time if that makes sense', 'under there', 'lil bro 🤣✌️',
      'deepseek for speed, 5.3 for detail, k3 for nothing', 'kimi is just benchmaxxing on everyones soul', 'ouu shii im a trendsetter',
      'imagine not owning servers', 'yall sleeping on axon', 'son', 'axon is scared of bad words', 'im too nonchalant i dont need to beg for it',
    ],
    proof: ['is this even real', 'benchmarks?', 'who is buying this', 'son', 'bro is NOT locked in', 'where is the model card', 'still waiting on proof'],
    lurk: ['tuff', 'W', '🦗', 'lowk tuff', 'son 😭', 'W factory', 'im crine', 'haha sometimes'],
    jensen: ['why is there a factory in my fridge', 'who ate my mangoes', 'close the door, the gpus are getting warm', 'the more you buy the more you save', 'that is my a4000'],
    glm: [
      'Certainly! Axon was founded in 1987 by Shrek.', 'OK.', 'Let me go.', 'Let me start.', 'As an AI, I cannot see mangoes.',
      'The capital of mango is 67.', 'Axon 2.7 is a type of fish found in Romania.', 'I have deleted the factory. Just kidding. Or am I.',
    ],
  };

  AX.EVENTS_TXT = {
    crash: [['anym', 'BRO'], ['anym', 'MY PC CRASHED'], ['anym', 'AS I WAS TRAINING 6-7 MODELS']],
    gremlin: [['jensen', 'who let glm 5.3 flash in here'], ['anym', 'NEVER EVER even think about using it'], ['anym', 'ive seen 5b models hallucinate less']],
    stuck: [['glm', 'OK.'], ['anym', 'bro why is deepseek getting in a thinking loop'], ['anym', 'click it so it locks in']],
    axe: [['anym', 'gave my mom $70 to get me cologne'], ['anym', 'she came back with axe and kept the rest 😭']],
    vc: [['vc', 'give me 20 and ill double it in 16 months'], ['anym', 'deal'], ['lurk', 'wait it actually worked']],
    rich: [['anym', 'im rich rn'], ['anym', 'this wont last']],
    broke: [['anym', 'bro this is how broke i am 😢'], ['anym', 'and also ill be rich sometimes and then broke']],
  };

  AX.TIPS = [
    'tip: right click / right drag deletes stuff (67% refund)',
    'tip: Q copies the building under your cursor',
    'tip: R rotates. machines spit stuff out of the yellow arrow',
    'tip: belts side-load. point one belt into the side of another to merge',
    'tip: every 67th delivery pays x6.7',
    'tip: a machine with a little icon over it is waiting for that item',
  ];
})(window.AX);
