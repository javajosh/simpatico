import {assertEquals, tryToStringify, log} from "./core.js";

const assertHandler = {
  name: 'assert',
  install: function(){return {handlers: {assert: this}}},
  call: a => ({handler: 'assert', ...a}),
  handle: (core, msg) => {
    Object.entries(msg).forEach(([key, msgValue]) => {
      if (key === 'handler' || key === 'parent') return; // skip the handler name itself
      // check only shallow keys. TODO: a structural assert using a variant of combine itself.
      if (core.hasOwnProperty(key)) assertEquals(msgValue, core[key]);
      else throw new Error(`core ${tryToStringify(core)} is missing asserted property ` + key);
    });
    return [];
  },
};

const logHandler = {
  name: 'log',
  handle: function (core, msg) {
    if (core.debug){
      let out = (msg && msg.hasOwnProperty('msg')) ? msg.msg : undefined;
      this.output('logHandler:', out, {msg, core});
      if (out){
        return [{lastOutput: msg.msg}];
      } else {
        return [];
      }

    }
  },
  // install is a convenience property to help ensure a clean initialization of the containing core
  install: function(output = log){
    this.output = output;
    return {
      handlers: {log: this},
      debug   : true, // residue that can turn off logging
      lastOutput: '', // the last thing logged
    }},
  // call is a convenience property that ensures the handler is called correctly, and we also support easy logging of bare strings
  call: a => {
    if (typeof a === 'string') a = {msg: a};
    return {handler: 'log', ...a};
  },
};

export {assertHandler, logHandler};
