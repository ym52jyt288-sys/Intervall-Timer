"use strict";

// Der Ablauf bleibt auch bei vielen Runden kompakt. Jede Phase hat einen
// eindeutigen Startpunkt, den Vorschau und Wiedergabe gemeinsam verwenden.
const TimerModel = (() => {
  function integer(value, minimum) {
    return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) >= minimum;
  }

  function timeline(timer) {
    let duration = 0;
    const spans = timer.blocks.map((block, index) => {
      const work = Number(block.work), rest = Number(block.rest), rounds = Number(block.rounds);
      const finalRest = index < timer.blocks.length - 1 || timer.finalRest;
      const start = duration;
      duration += work * rounds + rest * (rounds - (finalRest ? 0 : 1));
      return { block, index, work, rest, rounds, start, end: duration };
    });

    function at(second) {
      const span = spans.find(part => second >= part.start && second < part.end);
      if (!span) return null;
      const cycle = span.work + span.rest;
      const local = second - span.start;
      const roundIndex = Math.floor(local / cycle);
      const resting = local - roundIndex * cycle >= span.work;
      const start = span.start + roundIndex * cycle + (resting ? span.work : 0);
      const length = resting ? span.rest : span.work;
      return { name: span.block.name.trim() || 'Block ' + (span.index + 1),
        index: span.index, round: roundIndex + 1, rounds: span.rounds, resting,
        length, start, end: start + length };
    }
    return { duration, at };
  }
  function durationText(seconds, pad = false) {
    const minutes = String(Math.floor(seconds / 60));
    return (pad ? minutes.padStart(2, '0') : minutes) + ':' + String(seconds % 60).padStart(2, '0');
  }
  return { integer, timeline, durationText };
})();
