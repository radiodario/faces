;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./vendor/dat.gui')
module.exports.color = require('./vendor/dat.color')
},{"./vendor/dat.color":2,"./vendor/dat.gui":3}],2:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/** @namespace */
var dat = module.exports = dat || {};

/** @namespace */
dat.color = dat.color || {};

/** @namespace */
dat.utils = dat.utils || {};

dat.utils.common = (function () {
  
  var ARR_EACH = Array.prototype.forEach;
  var ARR_SLICE = Array.prototype.slice;

  /**
   * Band-aid methods for things that should be a lot easier in JavaScript.
   * Implementation and structure inspired by underscore.js
   * http://documentcloud.github.com/underscore/
   */

  return { 
    
    BREAK: {},
  
    extend: function(target) {
      
      this.each(ARR_SLICE.call(arguments, 1), function(obj) {
        
        for (var key in obj)
          if (!this.isUndefined(obj[key])) 
            target[key] = obj[key];
        
      }, this);
      
      return target;
      
    },
    
    defaults: function(target) {
      
      this.each(ARR_SLICE.call(arguments, 1), function(obj) {
        
        for (var key in obj)
          if (this.isUndefined(target[key])) 
            target[key] = obj[key];
        
      }, this);
      
      return target;
    
    },
    
    compose: function() {
      var toCall = ARR_SLICE.call(arguments);
            return function() {
              var args = ARR_SLICE.call(arguments);
              for (var i = toCall.length -1; i >= 0; i--) {
                args = [toCall[i].apply(this, args)];
              }
              return args[0];
            }
    },
    
    each: function(obj, itr, scope) {

      
      if (ARR_EACH && obj.forEach === ARR_EACH) { 
        
        obj.forEach(itr, scope);
        
      } else if (obj.length === obj.length + 0) { // Is number but not NaN
        
        for (var key = 0, l = obj.length; key < l; key++)
          if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) 
            return;
            
      } else {

        for (var key in obj) 
          if (itr.call(scope, obj[key], key) === this.BREAK)
            return;
            
      }
            
    },
    
    defer: function(fnc) {
      setTimeout(fnc, 0);
    },
    
    toArray: function(obj) {
      if (obj.toArray) return obj.toArray();
      return ARR_SLICE.call(obj);
    },

    isUndefined: function(obj) {
      return obj === undefined;
    },
    
    isNull: function(obj) {
      return obj === null;
    },
    
    isNaN: function(obj) {
      return obj !== obj;
    },
    
    isArray: Array.isArray || function(obj) {
      return obj.constructor === Array;
    },
    
    isObject: function(obj) {
      return obj === Object(obj);
    },
    
    isNumber: function(obj) {
      return obj === obj+0;
    },
    
    isString: function(obj) {
      return obj === obj+'';
    },
    
    isBoolean: function(obj) {
      return obj === false || obj === true;
    },
    
    isFunction: function(obj) {
      return Object.prototype.toString.call(obj) === '[object Function]';
    }
  
  };
    
})();


dat.color.toString = (function (common) {

  return function(color) {

    if (color.a == 1 || common.isUndefined(color.a)) {

      var s = color.hex.toString(16);
      while (s.length < 6) {
        s = '0' + s;
      }

      return '#' + s;

    } else {

      return 'rgba(' + Math.round(color.r) + ',' + Math.round(color.g) + ',' + Math.round(color.b) + ',' + color.a + ')';

    }

  }

})(dat.utils.common);


dat.Color = dat.color.Color = (function (interpret, math, toString, common) {

  var Color = function() {

    this.__state = interpret.apply(this, arguments);

    if (this.__state === false) {
      throw 'Failed to interpret color arguments';
    }

    this.__state.a = this.__state.a || 1;


  };

  Color.COMPONENTS = ['r','g','b','h','s','v','hex','a'];

  common.extend(Color.prototype, {

    toString: function() {
      return toString(this);
    },

    toOriginal: function() {
      return this.__state.conversion.write(this);
    }

  });

  defineRGBComponent(Color.prototype, 'r', 2);
  defineRGBComponent(Color.prototype, 'g', 1);
  defineRGBComponent(Color.prototype, 'b', 0);

  defineHSVComponent(Color.prototype, 'h');
  defineHSVComponent(Color.prototype, 's');
  defineHSVComponent(Color.prototype, 'v');

  Object.defineProperty(Color.prototype, 'a', {

    get: function() {
      return this.__state.a;
    },

    set: function(v) {
      this.__state.a = v;
    }

  });

  Object.defineProperty(Color.prototype, 'hex', {

    get: function() {

      if (!this.__state.space !== 'HEX') {
        this.__state.hex = math.rgb_to_hex(this.r, this.g, this.b);
      }

      return this.__state.hex;

    },

    set: function(v) {

      this.__state.space = 'HEX';
      this.__state.hex = v;

    }

  });

  function defineRGBComponent(target, component, componentHexIndex) {

    Object.defineProperty(target, component, {

      get: function() {

        if (this.__state.space === 'RGB') {
          return this.__state[component];
        }

        recalculateRGB(this, component, componentHexIndex);

        return this.__state[component];

      },

      set: function(v) {

        if (this.__state.space !== 'RGB') {
          recalculateRGB(this, component, componentHexIndex);
          this.__state.space = 'RGB';
        }

        this.__state[component] = v;

      }

    });

  }

  function defineHSVComponent(target, component) {

    Object.defineProperty(target, component, {

      get: function() {

        if (this.__state.space === 'HSV')
          return this.__state[component];

        recalculateHSV(this);

        return this.__state[component];

      },

      set: function(v) {

        if (this.__state.space !== 'HSV') {
          recalculateHSV(this);
          this.__state.space = 'HSV';
        }

        this.__state[component] = v;

      }

    });

  }

  function recalculateRGB(color, component, componentHexIndex) {

    if (color.__state.space === 'HEX') {

      color.__state[component] = math.component_from_hex(color.__state.hex, componentHexIndex);

    } else if (color.__state.space === 'HSV') {

      common.extend(color.__state, math.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));

    } else {

      throw 'Corrupted color state';

    }

  }

  function recalculateHSV(color) {

    var result = math.rgb_to_hsv(color.r, color.g, color.b);

    common.extend(color.__state,
        {
          s: result.s,
          v: result.v
        }
    );

    if (!common.isNaN(result.h)) {
      color.__state.h = result.h;
    } else if (common.isUndefined(color.__state.h)) {
      color.__state.h = 0;
    }

  }

  return Color;

})(dat.color.interpret = (function (toString, common) {

  var result, toReturn;

  var interpret = function() {

    toReturn = false;

    var original = arguments.length > 1 ? common.toArray(arguments) : arguments[0];

    common.each(INTERPRETATIONS, function(family) {

      if (family.litmus(original)) {

        common.each(family.conversions, function(conversion, conversionName) {

          result = conversion.read(original);

          if (toReturn === false && result !== false) {
            toReturn = result;
            result.conversionName = conversionName;
            result.conversion = conversion;
            return common.BREAK;

          }

        });

        return common.BREAK;

      }

    });

    return toReturn;

  };

  var INTERPRETATIONS = [

    // Strings
    {

      litmus: common.isString,

      conversions: {

        THREE_CHAR_HEX: {

          read: function(original) {

            var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
            if (test === null) return false;

            return {
              space: 'HEX',
              hex: parseInt(
                  '0x' +
                      test[1].toString() + test[1].toString() +
                      test[2].toString() + test[2].toString() +
                      test[3].toString() + test[3].toString())
            };

          },

          write: toString

        },

        SIX_CHAR_HEX: {

          read: function(original) {

            var test = original.match(/^#([A-F0-9]{6})$/i);
            if (test === null) return false;

            return {
              space: 'HEX',
              hex: parseInt('0x' + test[1].toString())
            };

          },

          write: toString

        },

        CSS_RGB: {

          read: function(original) {

            var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
            if (test === null) return false;

            return {
              space: 'RGB',
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3])
            };

          },

          write: toString

        },

        CSS_RGBA: {

          read: function(original) {

            var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\,\s*(.+)\s*\)/);
            if (test === null) return false;

            return {
              space: 'RGB',
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3]),
              a: parseFloat(test[4])
            };

          },

          write: toString

        }

      }

    },

    // Numbers
    {

      litmus: common.isNumber,

      conversions: {

        HEX: {
          read: function(original) {
            return {
              space: 'HEX',
              hex: original,
              conversionName: 'HEX'
            }
          },

          write: function(color) {
            return color.hex;
          }
        }

      }

    },

    // Arrays
    {

      litmus: common.isArray,

      conversions: {

        RGB_ARRAY: {
          read: function(original) {
            if (original.length != 3) return false;
            return {
              space: 'RGB',
              r: original[0],
              g: original[1],
              b: original[2]
            };
          },

          write: function(color) {
            return [color.r, color.g, color.b];
          }

        },

        RGBA_ARRAY: {
          read: function(original) {
            if (original.length != 4) return false;
            return {
              space: 'RGB',
              r: original[0],
              g: original[1],
              b: original[2],
              a: original[3]
            };
          },

          write: function(color) {
            return [color.r, color.g, color.b, color.a];
          }

        }

      }

    },

    // Objects
    {

      litmus: common.isObject,

      conversions: {

        RGBA_OBJ: {
          read: function(original) {
            if (common.isNumber(original.r) &&
                common.isNumber(original.g) &&
                common.isNumber(original.b) &&
                common.isNumber(original.a)) {
              return {
                space: 'RGB',
                r: original.r,
                g: original.g,
                b: original.b,
                a: original.a
              }
            }
            return false;
          },

          write: function(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b,
              a: color.a
            }
          }
        },

        RGB_OBJ: {
          read: function(original) {
            if (common.isNumber(original.r) &&
                common.isNumber(original.g) &&
                common.isNumber(original.b)) {
              return {
                space: 'RGB',
                r: original.r,
                g: original.g,
                b: original.b
              }
            }
            return false;
          },

          write: function(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b
            }
          }
        },

        HSVA_OBJ: {
          read: function(original) {
            if (common.isNumber(original.h) &&
                common.isNumber(original.s) &&
                common.isNumber(original.v) &&
                common.isNumber(original.a)) {
              return {
                space: 'HSV',
                h: original.h,
                s: original.s,
                v: original.v,
                a: original.a
              }
            }
            return false;
          },

          write: function(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v,
              a: color.a
            }
          }
        },

        HSV_OBJ: {
          read: function(original) {
            if (common.isNumber(original.h) &&
                common.isNumber(original.s) &&
                common.isNumber(original.v)) {
              return {
                space: 'HSV',
                h: original.h,
                s: original.s,
                v: original.v
              }
            }
            return false;
          },

          write: function(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v
            }
          }

        }

      }

    }


  ];

  return interpret;


})(dat.color.toString,
dat.utils.common),
dat.color.math = (function () {

  var tmpComponent;

  return {

    hsv_to_rgb: function(h, s, v) {

      var hi = Math.floor(h / 60) % 6;

      var f = h / 60 - Math.floor(h / 60);
      var p = v * (1.0 - s);
      var q = v * (1.0 - (f * s));
      var t = v * (1.0 - ((1.0 - f) * s));
      var c = [
        [v, t, p],
        [q, v, p],
        [p, v, t],
        [p, q, v],
        [t, p, v],
        [v, p, q]
      ][hi];

      return {
        r: c[0] * 255,
        g: c[1] * 255,
        b: c[2] * 255
      };

    },

    rgb_to_hsv: function(r, g, b) {

      var min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          delta = max - min,
          h, s;

      if (max != 0) {
        s = delta / max;
      } else {
        return {
          h: NaN,
          s: 0,
          v: 0
        };
      }

      if (r == max) {
        h = (g - b) / delta;
      } else if (g == max) {
        h = 2 + (b - r) / delta;
      } else {
        h = 4 + (r - g) / delta;
      }
      h /= 6;
      if (h < 0) {
        h += 1;
      }

      return {
        h: h * 360,
        s: s,
        v: max / 255
      };
    },

    rgb_to_hex: function(r, g, b) {
      var hex = this.hex_with_component(0, 2, r);
      hex = this.hex_with_component(hex, 1, g);
      hex = this.hex_with_component(hex, 0, b);
      return hex;
    },

    component_from_hex: function(hex, componentIndex) {
      return (hex >> (componentIndex * 8)) & 0xFF;
    },

    hex_with_component: function(hex, componentIndex, value) {
      return value << (tmpComponent = componentIndex * 8) | (hex & ~ (0xFF << tmpComponent));
    }

  }

})(),
dat.color.toString,
dat.utils.common);
},{}],3:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/** @namespace */
var dat = module.exports = dat || {};

/** @namespace */
dat.gui = dat.gui || {};

/** @namespace */
dat.utils = dat.utils || {};

/** @namespace */
dat.controllers = dat.controllers || {};

/** @namespace */
dat.dom = dat.dom || {};

/** @namespace */
dat.color = dat.color || {};

dat.utils.css = (function () {
  return {
    load: function (url, doc) {
      doc = doc || document;
      var link = doc.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;
      doc.getElementsByTagName('head')[0].appendChild(link);
    },
    inject: function(css, doc) {
      doc = doc || document;
      var injected = document.createElement('style');
      injected.type = 'text/css';
      injected.innerHTML = css;
      doc.getElementsByTagName('head')[0].appendChild(injected);
    }
  }
})();


dat.utils.common = (function () {
  
  var ARR_EACH = Array.prototype.forEach;
  var ARR_SLICE = Array.prototype.slice;

  /**
   * Band-aid methods for things that should be a lot easier in JavaScript.
   * Implementation and structure inspired by underscore.js
   * http://documentcloud.github.com/underscore/
   */

  return { 
    
    BREAK: {},
  
    extend: function(target) {
      
      this.each(ARR_SLICE.call(arguments, 1), function(obj) {
        
        for (var key in obj)
          if (!this.isUndefined(obj[key])) 
            target[key] = obj[key];
        
      }, this);
      
      return target;
      
    },
    
    defaults: function(target) {
      
      this.each(ARR_SLICE.call(arguments, 1), function(obj) {
        
        for (var key in obj)
          if (this.isUndefined(target[key])) 
            target[key] = obj[key];
        
      }, this);
      
      return target;
    
    },
    
    compose: function() {
      var toCall = ARR_SLICE.call(arguments);
            return function() {
              var args = ARR_SLICE.call(arguments);
              for (var i = toCall.length -1; i >= 0; i--) {
                args = [toCall[i].apply(this, args)];
              }
              return args[0];
            }
    },
    
    each: function(obj, itr, scope) {

      
      if (ARR_EACH && obj.forEach === ARR_EACH) { 
        
        obj.forEach(itr, scope);
        
      } else if (obj.length === obj.length + 0) { // Is number but not NaN
        
        for (var key = 0, l = obj.length; key < l; key++)
          if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) 
            return;
            
      } else {

        for (var key in obj) 
          if (itr.call(scope, obj[key], key) === this.BREAK)
            return;
            
      }
            
    },
    
    defer: function(fnc) {
      setTimeout(fnc, 0);
    },
    
    toArray: function(obj) {
      if (obj.toArray) return obj.toArray();
      return ARR_SLICE.call(obj);
    },

    isUndefined: function(obj) {
      return obj === undefined;
    },
    
    isNull: function(obj) {
      return obj === null;
    },
    
    isNaN: function(obj) {
      return obj !== obj;
    },
    
    isArray: Array.isArray || function(obj) {
      return obj.constructor === Array;
    },
    
    isObject: function(obj) {
      return obj === Object(obj);
    },
    
    isNumber: function(obj) {
      return obj === obj+0;
    },
    
    isString: function(obj) {
      return obj === obj+'';
    },
    
    isBoolean: function(obj) {
      return obj === false || obj === true;
    },
    
    isFunction: function(obj) {
      return Object.prototype.toString.call(obj) === '[object Function]';
    }
  
  };
    
})();


dat.controllers.Controller = (function (common) {

  /**
   * @class An "abstract" class that represents a given property of an object.
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   *
   * @member dat.controllers
   */
  var Controller = function(object, property) {

    this.initialValue = object[property];

    /**
     * Those who extend this class will put their DOM elements in here.
     * @type {DOMElement}
     */
    this.domElement = document.createElement('div');

    /**
     * The object to manipulate
     * @type {Object}
     */
    this.object = object;

    /**
     * The name of the property to manipulate
     * @type {String}
     */
    this.property = property;

    /**
     * The function to be called on change.
     * @type {Function}
     * @ignore
     */
    this.__onChange = undefined;

    /**
     * The function to be called on finishing change.
     * @type {Function}
     * @ignore
     */
    this.__onFinishChange = undefined;

  };

  common.extend(

      Controller.prototype,

      /** @lends dat.controllers.Controller.prototype */
      {

        /**
         * Specify that a function fire every time someone changes the value with
         * this Controller.
         *
         * @param {Function} fnc This function will be called whenever the value
         * is modified via this Controller.
         * @returns {dat.controllers.Controller} this
         */
        onChange: function(fnc) {
          this.__onChange = fnc;
          return this;
        },

        /**
         * Specify that a function fire every time someone "finishes" changing
         * the value wih this Controller. Useful for values that change
         * incrementally like numbers or strings.
         *
         * @param {Function} fnc This function will be called whenever
         * someone "finishes" changing the value via this Controller.
         * @returns {dat.controllers.Controller} this
         */
        onFinishChange: function(fnc) {
          this.__onFinishChange = fnc;
          return this;
        },

        /**
         * Change the value of <code>object[property]</code>
         *
         * @param {Object} newValue The new value of <code>object[property]</code>
         */
        setValue: function(newValue) {
          this.object[this.property] = newValue;
          if (this.__onChange) {
            this.__onChange.call(this, newValue);
          }
          this.updateDisplay();
          return this;
        },

        /**
         * Gets the value of <code>object[property]</code>
         *
         * @returns {Object} The current value of <code>object[property]</code>
         */
        getValue: function() {
          return this.object[this.property];
        },

        /**
         * Refreshes the visual display of a Controller in order to keep sync
         * with the object's current value.
         * @returns {dat.controllers.Controller} this
         */
        updateDisplay: function() {
          return this;
        },

        /**
         * @returns {Boolean} true if the value has deviated from initialValue
         */
        isModified: function() {
          return this.initialValue !== this.getValue()
        }

      }

  );

  return Controller;


})(dat.utils.common);


dat.dom.dom = (function (common) {

  var EVENT_MAP = {
    'HTMLEvents': ['change'],
    'MouseEvents': ['click','mousemove','mousedown','mouseup', 'mouseover'],
    'KeyboardEvents': ['keydown']
  };

  var EVENT_MAP_INV = {};
  common.each(EVENT_MAP, function(v, k) {
    common.each(v, function(e) {
      EVENT_MAP_INV[e] = k;
    });
  });

  var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;

  function cssValueToPixels(val) {

    if (val === '0' || common.isUndefined(val)) return 0;

    var match = val.match(CSS_VALUE_PIXELS);

    if (!common.isNull(match)) {
      return parseFloat(match[1]);
    }

    // TODO ...ems? %?

    return 0;

  }

  /**
   * @namespace
   * @member dat.dom
   */
  var dom = {

    /**
     * 
     * @param elem
     * @param selectable
     */
    makeSelectable: function(elem, selectable) {

      if (elem === undefined || elem.style === undefined) return;

      elem.onselectstart = selectable ? function() {
        return false;
      } : function() {
      };

      elem.style.MozUserSelect = selectable ? 'auto' : 'none';
      elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
      elem.unselectable = selectable ? 'on' : 'off';

    },

    /**
     *
     * @param elem
     * @param horizontal
     * @param vertical
     */
    makeFullscreen: function(elem, horizontal, vertical) {

      if (common.isUndefined(horizontal)) horizontal = true;
      if (common.isUndefined(vertical)) vertical = true;

      elem.style.position = 'absolute';

      if (horizontal) {
        elem.style.left = 0;
        elem.style.right = 0;
      }
      if (vertical) {
        elem.style.top = 0;
        elem.style.bottom = 0;
      }

    },

    /**
     *
     * @param elem
     * @param eventType
     * @param params
     */
    fakeEvent: function(elem, eventType, params, aux) {
      params = params || {};
      var className = EVENT_MAP_INV[eventType];
      if (!className) {
        throw new Error('Event type ' + eventType + ' not supported.');
      }
      var evt = document.createEvent(className);
      switch (className) {
        case 'MouseEvents':
          var clientX = params.x || params.clientX || 0;
          var clientY = params.y || params.clientY || 0;
          evt.initMouseEvent(eventType, params.bubbles || false,
              params.cancelable || true, window, params.clickCount || 1,
              0, //screen X
              0, //screen Y
              clientX, //client X
              clientY, //client Y
              false, false, false, false, 0, null);
          break;
        case 'KeyboardEvents':
          var init = evt.initKeyboardEvent || evt.initKeyEvent; // webkit || moz
          common.defaults(params, {
            cancelable: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            keyCode: undefined,
            charCode: undefined
          });
          init(eventType, params.bubbles || false,
              params.cancelable, window,
              params.ctrlKey, params.altKey,
              params.shiftKey, params.metaKey,
              params.keyCode, params.charCode);
          break;
        default:
          evt.initEvent(eventType, params.bubbles || false,
              params.cancelable || true);
          break;
      }
      common.defaults(evt, aux);
      elem.dispatchEvent(evt);
    },

    /**
     *
     * @param elem
     * @param event
     * @param func
     * @param bool
     */
    bind: function(elem, event, func, bool) {
      bool = bool || false;
      if (elem.addEventListener)
        elem.addEventListener(event, func, bool);
      else if (elem.attachEvent)
        elem.attachEvent('on' + event, func);
      return dom;
    },

    /**
     *
     * @param elem
     * @param event
     * @param func
     * @param bool
     */
    unbind: function(elem, event, func, bool) {
      bool = bool || false;
      if (elem.removeEventListener)
        elem.removeEventListener(event, func, bool);
      else if (elem.detachEvent)
        elem.detachEvent('on' + event, func);
      return dom;
    },

    /**
     *
     * @param elem
     * @param className
     */
    addClass: function(elem, className) {
      if (elem.className === undefined) {
        elem.className = className;
      } else if (elem.className !== className) {
        var classes = elem.className.split(/ +/);
        if (classes.indexOf(className) == -1) {
          classes.push(className);
          elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
        }
      }
      return dom;
    },

    /**
     *
     * @param elem
     * @param className
     */
    removeClass: function(elem, className) {
      if (className) {
        if (elem.className === undefined) {
          // elem.className = className;
        } else if (elem.className === className) {
          elem.removeAttribute('class');
        } else {
          var classes = elem.className.split(/ +/);
          var index = classes.indexOf(className);
          if (index != -1) {
            classes.splice(index, 1);
            elem.className = classes.join(' ');
          }
        }
      } else {
        elem.className = undefined;
      }
      return dom;
    },

    hasClass: function(elem, className) {
      return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
    },

    /**
     *
     * @param elem
     */
    getWidth: function(elem) {

      var style = getComputedStyle(elem);

      return cssValueToPixels(style['border-left-width']) +
          cssValueToPixels(style['border-right-width']) +
          cssValueToPixels(style['padding-left']) +
          cssValueToPixels(style['padding-right']) +
          cssValueToPixels(style['width']);
    },

    /**
     *
     * @param elem
     */
    getHeight: function(elem) {

      var style = getComputedStyle(elem);

      return cssValueToPixels(style['border-top-width']) +
          cssValueToPixels(style['border-bottom-width']) +
          cssValueToPixels(style['padding-top']) +
          cssValueToPixels(style['padding-bottom']) +
          cssValueToPixels(style['height']);
    },

    /**
     *
     * @param elem
     */
    getOffset: function(elem) {
      var offset = {left: 0, top:0};
      if (elem.offsetParent) {
        do {
          offset.left += elem.offsetLeft;
          offset.top += elem.offsetTop;
        } while (elem = elem.offsetParent);
      }
      return offset;
    },

    // http://stackoverflow.com/posts/2684561/revisions
    /**
     * 
     * @param elem
     */
    isActive: function(elem) {
      return elem === document.activeElement && ( elem.type || elem.href );
    }

  };

  return dom;

})(dat.utils.common);


dat.controllers.OptionController = (function (Controller, dom, common) {

  /**
   * @class Provides a select input to alter the property of an object, using a
   * list of accepted values.
   *
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   * @param {Object|string[]} options A map of labels to acceptable values, or
   * a list of acceptable string values.
   *
   * @member dat.controllers
   */
  var OptionController = function(object, property, options) {

    OptionController.superclass.call(this, object, property);

    var _this = this;

    /**
     * The drop down menu
     * @ignore
     */
    this.__select = document.createElement('select');

    if (common.isArray(options)) {
      var map = {};
      common.each(options, function(element) {
        map[element] = element;
      });
      options = map;
    }

    common.each(options, function(value, key) {

      var opt = document.createElement('option');
      opt.innerHTML = key;
      opt.setAttribute('value', value);
      _this.__select.appendChild(opt);

    });

    // Acknowledge original value
    this.updateDisplay();

    dom.bind(this.__select, 'change', function() {
      var desiredValue = this.options[this.selectedIndex].value;
      _this.setValue(desiredValue);
    });

    this.domElement.appendChild(this.__select);

  };

  OptionController.superclass = Controller;

  common.extend(

      OptionController.prototype,
      Controller.prototype,

      {

        setValue: function(v) {
          var toReturn = OptionController.superclass.prototype.setValue.call(this, v);
          if (this.__onFinishChange) {
            this.__onFinishChange.call(this, this.getValue());
          }
          return toReturn;
        },

        updateDisplay: function() {
          this.__select.value = this.getValue();
          return OptionController.superclass.prototype.updateDisplay.call(this);
        }

      }

  );

  return OptionController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.utils.common);


dat.controllers.NumberController = (function (Controller, common) {

  /**
   * @class Represents a given property of an object that is a number.
   *
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   * @param {Object} [params] Optional parameters
   * @param {Number} [params.min] Minimum allowed value
   * @param {Number} [params.max] Maximum allowed value
   * @param {Number} [params.step] Increment by which to change value
   *
   * @member dat.controllers
   */
  var NumberController = function(object, property, params) {

    NumberController.superclass.call(this, object, property);

    params = params || {};

    this.__min = params.min;
    this.__max = params.max;
    this.__step = params.step;

    if (common.isUndefined(this.__step)) {

      if (this.initialValue == 0) {
        this.__impliedStep = 1; // What are we, psychics?
      } else {
        // Hey Doug, check this out.
        this.__impliedStep = Math.pow(10, Math.floor(Math.log(this.initialValue)/Math.LN10))/10;
      }

    } else {

      this.__impliedStep = this.__step;

    }

    this.__precision = numDecimals(this.__impliedStep);


  };

  NumberController.superclass = Controller;

  common.extend(

      NumberController.prototype,
      Controller.prototype,

      /** @lends dat.controllers.NumberController.prototype */
      {

        setValue: function(v) {

          if (this.__min !== undefined && v < this.__min) {
            v = this.__min;
          } else if (this.__max !== undefined && v > this.__max) {
            v = this.__max;
          }

          if (this.__step !== undefined && v % this.__step != 0) {
            v = Math.round(v / this.__step) * this.__step;
          }

          return NumberController.superclass.prototype.setValue.call(this, v);

        },

        /**
         * Specify a minimum value for <code>object[property]</code>.
         *
         * @param {Number} minValue The minimum value for
         * <code>object[property]</code>
         * @returns {dat.controllers.NumberController} this
         */
        min: function(v) {
          this.__min = v;
          return this;
        },

        /**
         * Specify a maximum value for <code>object[property]</code>.
         *
         * @param {Number} maxValue The maximum value for
         * <code>object[property]</code>
         * @returns {dat.controllers.NumberController} this
         */
        max: function(v) {
          this.__max = v;
          return this;
        },

        /**
         * Specify a step value that dat.controllers.NumberController
         * increments by.
         *
         * @param {Number} stepValue The step value for
         * dat.controllers.NumberController
         * @default if minimum and maximum specified increment is 1% of the
         * difference otherwise stepValue is 1
         * @returns {dat.controllers.NumberController} this
         */
        step: function(v) {
          this.__step = v;
          return this;
        }

      }

  );

  function numDecimals(x) {
    x = x.toString();
    if (x.indexOf('.') > -1) {
      return x.length - x.indexOf('.') - 1;
    } else {
      return 0;
    }
  }

  return NumberController;

})(dat.controllers.Controller,
dat.utils.common);


dat.controllers.NumberControllerBox = (function (NumberController, dom, common) {

  /**
   * @class Represents a given property of an object that is a number and
   * provides an input element with which to manipulate it.
   *
   * @extends dat.controllers.Controller
   * @extends dat.controllers.NumberController
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   * @param {Object} [params] Optional parameters
   * @param {Number} [params.min] Minimum allowed value
   * @param {Number} [params.max] Maximum allowed value
   * @param {Number} [params.step] Increment by which to change value
   *
   * @member dat.controllers
   */
  var NumberControllerBox = function(object, property, params) {

    this.__truncationSuspended = false;

    NumberControllerBox.superclass.call(this, object, property, params);

    var _this = this;

    /**
     * {Number} Previous mouse y position
     * @ignore
     */
    var prev_y;

    this.__input = document.createElement('input');
    this.__input.setAttribute('type', 'text');

    // Makes it so manually specified values are not truncated.

    dom.bind(this.__input, 'change', onChange);
    dom.bind(this.__input, 'blur', onBlur);
    dom.bind(this.__input, 'mousedown', onMouseDown);
    dom.bind(this.__input, 'keydown', function(e) {

      // When pressing entire, you can be as precise as you want.
      if (e.keyCode === 13) {
        _this.__truncationSuspended = true;
        this.blur();
        _this.__truncationSuspended = false;
      }

    });

    function onChange() {
      var attempted = parseFloat(_this.__input.value);
      if (!common.isNaN(attempted)) _this.setValue(attempted);
    }

    function onBlur() {
      onChange();
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    function onMouseDown(e) {
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      prev_y = e.clientY;
    }

    function onMouseDrag(e) {

      var diff = prev_y - e.clientY;
      _this.setValue(_this.getValue() + diff * _this.__impliedStep);

      prev_y = e.clientY;

    }

    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
    }

    this.updateDisplay();

    this.domElement.appendChild(this.__input);

  };

  NumberControllerBox.superclass = NumberController;

  common.extend(

      NumberControllerBox.prototype,
      NumberController.prototype,

      {

        updateDisplay: function() {

          this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
          return NumberControllerBox.superclass.prototype.updateDisplay.call(this);
        }

      }

  );

  function roundToDecimal(value, decimals) {
    var tenTo = Math.pow(10, decimals);
    return Math.round(value * tenTo) / tenTo;
  }

  return NumberControllerBox;

})(dat.controllers.NumberController,
dat.dom.dom,
dat.utils.common);


dat.controllers.NumberControllerSlider = (function (NumberController, dom, css, common, styleSheet) {

  /**
   * @class Represents a given property of an object that is a number, contains
   * a minimum and maximum, and provides a slider element with which to
   * manipulate it. It should be noted that the slider element is made up of
   * <code>&lt;div&gt;</code> tags, <strong>not</strong> the html5
   * <code>&lt;slider&gt;</code> element.
   *
   * @extends dat.controllers.Controller
   * @extends dat.controllers.NumberController
   * 
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   * @param {Number} minValue Minimum allowed value
   * @param {Number} maxValue Maximum allowed value
   * @param {Number} stepValue Increment by which to change value
   *
   * @member dat.controllers
   */
  var NumberControllerSlider = function(object, property, min, max, step) {

    NumberControllerSlider.superclass.call(this, object, property, { min: min, max: max, step: step });

    var _this = this;

    this.__background = document.createElement('div');
    this.__foreground = document.createElement('div');
    


    dom.bind(this.__background, 'mousedown', onMouseDown);
    
    dom.addClass(this.__background, 'slider');
    dom.addClass(this.__foreground, 'slider-fg');

    function onMouseDown(e) {

      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);

      onMouseDrag(e);
    }

    function onMouseDrag(e) {

      e.preventDefault();

      var offset = dom.getOffset(_this.__background);
      var width = dom.getWidth(_this.__background);
      
      _this.setValue(
        map(e.clientX, offset.left, offset.left + width, _this.__min, _this.__max)
      );

      return false;

    }

    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    this.updateDisplay();

    this.__background.appendChild(this.__foreground);
    this.domElement.appendChild(this.__background);

  };

  NumberControllerSlider.superclass = NumberController;

  /**
   * Injects default stylesheet for slider elements.
   */
  NumberControllerSlider.useDefaultStyles = function() {
    css.inject(styleSheet);
  };

  common.extend(

      NumberControllerSlider.prototype,
      NumberController.prototype,

      {

        updateDisplay: function() {
          var pct = (this.getValue() - this.__min)/(this.__max - this.__min);
          this.__foreground.style.width = pct*100+'%';
          return NumberControllerSlider.superclass.prototype.updateDisplay.call(this);
        }

      }



  );

  function map(v, i1, i2, o1, o2) {
    return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
  }

  return NumberControllerSlider;
  
})(dat.controllers.NumberController,
dat.dom.dom,
dat.utils.css,
dat.utils.common,
".slider {\n  box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);\n  height: 1em;\n  border-radius: 1em;\n  background-color: #eee;\n  padding: 0 0.5em;\n  overflow: hidden;\n}\n\n.slider-fg {\n  padding: 1px 0 2px 0;\n  background-color: #aaa;\n  height: 1em;\n  margin-left: -0.5em;\n  padding-right: 0.5em;\n  border-radius: 1em 0 0 1em;\n}\n\n.slider-fg:after {\n  display: inline-block;\n  border-radius: 1em;\n  background-color: #fff;\n  border:  1px solid #aaa;\n  content: '';\n  float: right;\n  margin-right: -1em;\n  margin-top: -1px;\n  height: 0.9em;\n  width: 0.9em;\n}");


dat.controllers.FunctionController = (function (Controller, dom, common) {

  /**
   * @class Provides a GUI interface to fire a specified method, a property of an object.
   *
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   *
   * @member dat.controllers
   */
  var FunctionController = function(object, property, text) {

    FunctionController.superclass.call(this, object, property);

    var _this = this;

    this.__button = document.createElement('div');
    this.__button.innerHTML = text === undefined ? 'Fire' : text;
    dom.bind(this.__button, 'click', function(e) {
      e.preventDefault();
      _this.fire();
      return false;
    });

    dom.addClass(this.__button, 'button');

    this.domElement.appendChild(this.__button);


  };

  FunctionController.superclass = Controller;

  common.extend(

      FunctionController.prototype,
      Controller.prototype,
      {
        
        fire: function() {
          if (this.__onChange) {
            this.__onChange.call(this);
          }
          if (this.__onFinishChange) {
            this.__onFinishChange.call(this, this.getValue());
          }
          this.getValue().call(this.object);
        }
      }

  );

  return FunctionController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.utils.common);


dat.controllers.BooleanController = (function (Controller, dom, common) {

  /**
   * @class Provides a checkbox input to alter the boolean property of an object.
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   *
   * @member dat.controllers
   */
  var BooleanController = function(object, property) {

    BooleanController.superclass.call(this, object, property);

    var _this = this;
    this.__prev = this.getValue();

    this.__checkbox = document.createElement('input');
    this.__checkbox.setAttribute('type', 'checkbox');


    dom.bind(this.__checkbox, 'change', onChange, false);

    this.domElement.appendChild(this.__checkbox);

    // Match original value
    this.updateDisplay();

    function onChange() {
      _this.setValue(!_this.__prev);
    }

  };

  BooleanController.superclass = Controller;

  common.extend(

      BooleanController.prototype,
      Controller.prototype,

      {

        setValue: function(v) {
          var toReturn = BooleanController.superclass.prototype.setValue.call(this, v);
          if (this.__onFinishChange) {
            this.__onFinishChange.call(this, this.getValue());
          }
          this.__prev = this.getValue();
          return toReturn;
        },

        updateDisplay: function() {
          
          if (this.getValue() === true) {
            this.__checkbox.setAttribute('checked', 'checked');
            this.__checkbox.checked = true;    
          } else {
              this.__checkbox.checked = false;
          }

          return BooleanController.superclass.prototype.updateDisplay.call(this);

        }


      }

  );

  return BooleanController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.utils.common);


dat.color.toString = (function (common) {

  return function(color) {

    if (color.a == 1 || common.isUndefined(color.a)) {

      var s = color.hex.toString(16);
      while (s.length < 6) {
        s = '0' + s;
      }

      return '#' + s;

    } else {

      return 'rgba(' + Math.round(color.r) + ',' + Math.round(color.g) + ',' + Math.round(color.b) + ',' + color.a + ')';

    }

  }

})(dat.utils.common);


dat.color.interpret = (function (toString, common) {

  var result, toReturn;

  var interpret = function() {

    toReturn = false;

    var original = arguments.length > 1 ? common.toArray(arguments) : arguments[0];

    common.each(INTERPRETATIONS, function(family) {

      if (family.litmus(original)) {

        common.each(family.conversions, function(conversion, conversionName) {

          result = conversion.read(original);

          if (toReturn === false && result !== false) {
            toReturn = result;
            result.conversionName = conversionName;
            result.conversion = conversion;
            return common.BREAK;

          }

        });

        return common.BREAK;

      }

    });

    return toReturn;

  };

  var INTERPRETATIONS = [

    // Strings
    {

      litmus: common.isString,

      conversions: {

        THREE_CHAR_HEX: {

          read: function(original) {

            var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
            if (test === null) return false;

            return {
              space: 'HEX',
              hex: parseInt(
                  '0x' +
                      test[1].toString() + test[1].toString() +
                      test[2].toString() + test[2].toString() +
                      test[3].toString() + test[3].toString())
            };

          },

          write: toString

        },

        SIX_CHAR_HEX: {

          read: function(original) {

            var test = original.match(/^#([A-F0-9]{6})$/i);
            if (test === null) return false;

            return {
              space: 'HEX',
              hex: parseInt('0x' + test[1].toString())
            };

          },

          write: toString

        },

        CSS_RGB: {

          read: function(original) {

            var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
            if (test === null) return false;

            return {
              space: 'RGB',
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3])
            };

          },

          write: toString

        },

        CSS_RGBA: {

          read: function(original) {

            var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\,\s*(.+)\s*\)/);
            if (test === null) return false;

            return {
              space: 'RGB',
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3]),
              a: parseFloat(test[4])
            };

          },

          write: toString

        }

      }

    },

    // Numbers
    {

      litmus: common.isNumber,

      conversions: {

        HEX: {
          read: function(original) {
            return {
              space: 'HEX',
              hex: original,
              conversionName: 'HEX'
            }
          },

          write: function(color) {
            return color.hex;
          }
        }

      }

    },

    // Arrays
    {

      litmus: common.isArray,

      conversions: {

        RGB_ARRAY: {
          read: function(original) {
            if (original.length != 3) return false;
            return {
              space: 'RGB',
              r: original[0],
              g: original[1],
              b: original[2]
            };
          },

          write: function(color) {
            return [color.r, color.g, color.b];
          }

        },

        RGBA_ARRAY: {
          read: function(original) {
            if (original.length != 4) return false;
            return {
              space: 'RGB',
              r: original[0],
              g: original[1],
              b: original[2],
              a: original[3]
            };
          },

          write: function(color) {
            return [color.r, color.g, color.b, color.a];
          }

        }

      }

    },

    // Objects
    {

      litmus: common.isObject,

      conversions: {

        RGBA_OBJ: {
          read: function(original) {
            if (common.isNumber(original.r) &&
                common.isNumber(original.g) &&
                common.isNumber(original.b) &&
                common.isNumber(original.a)) {
              return {
                space: 'RGB',
                r: original.r,
                g: original.g,
                b: original.b,
                a: original.a
              }
            }
            return false;
          },

          write: function(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b,
              a: color.a
            }
          }
        },

        RGB_OBJ: {
          read: function(original) {
            if (common.isNumber(original.r) &&
                common.isNumber(original.g) &&
                common.isNumber(original.b)) {
              return {
                space: 'RGB',
                r: original.r,
                g: original.g,
                b: original.b
              }
            }
            return false;
          },

          write: function(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b
            }
          }
        },

        HSVA_OBJ: {
          read: function(original) {
            if (common.isNumber(original.h) &&
                common.isNumber(original.s) &&
                common.isNumber(original.v) &&
                common.isNumber(original.a)) {
              return {
                space: 'HSV',
                h: original.h,
                s: original.s,
                v: original.v,
                a: original.a
              }
            }
            return false;
          },

          write: function(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v,
              a: color.a
            }
          }
        },

        HSV_OBJ: {
          read: function(original) {
            if (common.isNumber(original.h) &&
                common.isNumber(original.s) &&
                common.isNumber(original.v)) {
              return {
                space: 'HSV',
                h: original.h,
                s: original.s,
                v: original.v
              }
            }
            return false;
          },

          write: function(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v
            }
          }

        }

      }

    }


  ];

  return interpret;


})(dat.color.toString,
dat.utils.common);


dat.GUI = dat.gui.GUI = (function (css, saveDialogueContents, styleSheet, controllerFactory, Controller, BooleanController, FunctionController, NumberControllerBox, NumberControllerSlider, OptionController, ColorController, requestAnimationFrame, CenteredDiv, dom, common) {

  css.inject(styleSheet);

  /** Outer-most className for GUI's */
  var CSS_NAMESPACE = 'dg';

  var HIDE_KEY_CODE = 72;

  /** The only value shared between the JS and SCSS. Use caution. */
  var CLOSE_BUTTON_HEIGHT = 20;

  var DEFAULT_DEFAULT_PRESET_NAME = 'Default';

  var SUPPORTS_LOCAL_STORAGE = (function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  })();

  var SAVE_DIALOGUE;

  /** Have we yet to create an autoPlace GUI? */
  var auto_place_virgin = true;

  /** Fixed position div that auto place GUI's go inside */
  var auto_place_container;

  /** Are we hiding the GUI's ? */
  var hide = false;

  /** GUI's which should be hidden */
  var hideable_guis = [];

  /**
   * A lightweight controller library for JavaScript. It allows you to easily
   * manipulate variables and fire functions on the fly.
   * @class
   *
   * @member dat.gui
   *
   * @param {Object} [params]
   * @param {String} [params.name] The name of this GUI.
   * @param {Object} [params.load] JSON object representing the saved state of
   * this GUI.
   * @param {Boolean} [params.auto=true]
   * @param {dat.gui.GUI} [params.parent] The GUI I'm nested in.
   * @param {Boolean} [params.closed] If true, starts closed
   */
  var GUI = function(params) {

    var _this = this;

    /**
     * Outermost DOM Element
     * @type DOMElement
     */
    this.domElement = document.createElement('div');
    this.__ul = document.createElement('ul');
    this.domElement.appendChild(this.__ul);

    dom.addClass(this.domElement, CSS_NAMESPACE);

    /**
     * Nested GUI's by name
     * @ignore
     */
    this.__folders = {};

    this.__controllers = [];

    /**
     * List of objects I'm remembering for save, only used in top level GUI
     * @ignore
     */
    this.__rememberedObjects = [];

    /**
     * Maps the index of remembered objects to a map of controllers, only used
     * in top level GUI.
     *
     * @private
     * @ignore
     *
     * @example
     * [
     *  {
     *    propertyName: Controller,
     *    anotherPropertyName: Controller
     *  },
     *  {
     *    propertyName: Controller
     *  }
     * ]
     */
    this.__rememberedObjectIndecesToControllers = [];

    this.__listening = [];

    params = params || {};

    // Default parameters
    params = common.defaults(params, {
      autoPlace: true,
      width: GUI.DEFAULT_WIDTH
    });

    params = common.defaults(params, {
      resizable: params.autoPlace,
      hideable: params.autoPlace
    });


    if (!common.isUndefined(params.load)) {

      // Explicit preset
      if (params.preset) params.load.preset = params.preset;

    } else {

      params.load = { preset: DEFAULT_DEFAULT_PRESET_NAME };

    }

    if (common.isUndefined(params.parent) && params.hideable) {
      hideable_guis.push(this);
    }

    // Only root level GUI's are resizable.
    params.resizable = common.isUndefined(params.parent) && params.resizable;


    if (params.autoPlace && common.isUndefined(params.scrollable)) {
      params.scrollable = true;
    }
//    params.scrollable = common.isUndefined(params.parent) && params.scrollable === true;

    // Not part of params because I don't want people passing this in via
    // constructor. Should be a 'remembered' value.
    var use_local_storage =
        SUPPORTS_LOCAL_STORAGE &&
            localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';

    Object.defineProperties(this,

        /** @lends dat.gui.GUI.prototype */
        {

          /**
           * The parent <code>GUI</code>
           * @type dat.gui.GUI
           */
          parent: {
            get: function() {
              return params.parent;
            }
          },

          scrollable: {
            get: function() {
              return params.scrollable;
            }
          },

          /**
           * Handles <code>GUI</code>'s element placement for you
           * @type Boolean
           */
          autoPlace: {
            get: function() {
              return params.autoPlace;
            }
          },

          /**
           * The identifier for a set of saved values
           * @type String
           */
          preset: {

            get: function() {
              if (_this.parent) {
                return _this.getRoot().preset;
              } else {
                return params.load.preset;
              }
            },

            set: function(v) {
              if (_this.parent) {
                _this.getRoot().preset = v;
              } else {
                params.load.preset = v;
              }
              setPresetSelectIndex(this);
              _this.revert();
            }

          },

          /**
           * The width of <code>GUI</code> element
           * @type Number
           */
          width: {
            get: function() {
              return params.width;
            },
            set: function(v) {
              params.width = v;
              setWidth(_this, v);
            }
          },

          /**
           * The name of <code>GUI</code>. Used for folders. i.e
           * a folder's name
           * @type String
           */
          name: {
            get: function() {
              return params.name;
            },
            set: function(v) {
              // TODO Check for collisions among sibling folders
              params.name = v;
              if (title_row_name) {
                title_row_name.innerHTML = params.name;
              }
            }
          },

          /**
           * Whether the <code>GUI</code> is collapsed or not
           * @type Boolean
           */
          closed: {
            get: function() {
              return params.closed;
            },
            set: function(v) {
              params.closed = v;
              if (params.closed) {
                dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
              } else {
                dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
              }
              // For browsers that aren't going to respect the CSS transition,
              // Lets just check our height against the window height right off
              // the bat.
              this.onResize();

              if (_this.__closeButton) {
                _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
              }
            }
          },

          /**
           * Contains all presets
           * @type Object
           */
          load: {
            get: function() {
              return params.load;
            }
          },

          /**
           * Determines whether or not to use <a href="https://developer.mozilla.org/en/DOM/Storage#localStorage">localStorage</a> as the means for
           * <code>remember</code>ing
           * @type Boolean
           */
          useLocalStorage: {

            get: function() {
              return use_local_storage;
            },
            set: function(bool) {
              if (SUPPORTS_LOCAL_STORAGE) {
                use_local_storage = bool;
                if (bool) {
                  dom.bind(window, 'unload', saveToLocalStorage);
                } else {
                  dom.unbind(window, 'unload', saveToLocalStorage);
                }
                localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
              }
            }

          }

        });

    // Are we a root level GUI?
    if (common.isUndefined(params.parent)) {

      params.closed = false;

      dom.addClass(this.domElement, GUI.CLASS_MAIN);
      dom.makeSelectable(this.domElement, false);

      // Are we supposed to be loading locally?
      if (SUPPORTS_LOCAL_STORAGE) {

        if (use_local_storage) {

          _this.useLocalStorage = true;

          var saved_gui = localStorage.getItem(getLocalStorageHash(this, 'gui'));

          if (saved_gui) {
            params.load = JSON.parse(saved_gui);
          }

        }

      }

      this.__closeButton = document.createElement('div');
      this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);
      this.domElement.appendChild(this.__closeButton);

      dom.bind(this.__closeButton, 'click', function() {

        _this.closed = !_this.closed;


      });


      // Oh, you're a nested GUI!
    } else {

      if (params.closed === undefined) {
        params.closed = true;
      }

      var title_row_name = document.createTextNode(params.name);
      dom.addClass(title_row_name, 'controller-name');

      var title_row = addRow(_this, title_row_name);

      var on_click_title = function(e) {
        e.preventDefault();
        _this.closed = !_this.closed;
        return false;
      };

      dom.addClass(this.__ul, GUI.CLASS_CLOSED);

      dom.addClass(title_row, 'title');
      dom.bind(title_row, 'click', on_click_title);

      if (!params.closed) {
        this.closed = false;
      }

    }

    if (params.autoPlace) {

      if (common.isUndefined(params.parent)) {

        if (auto_place_virgin) {
          auto_place_container = document.createElement('div');
          dom.addClass(auto_place_container, CSS_NAMESPACE);
          dom.addClass(auto_place_container, GUI.CLASS_AUTO_PLACE_CONTAINER);
          document.body.appendChild(auto_place_container);
          auto_place_virgin = false;
        }

        // Put it in the dom for you.
        auto_place_container.appendChild(this.domElement);

        // Apply the auto styles
        dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);

      }


      // Make it not elastic.
      if (!this.parent) setWidth(_this, params.width);

    }

    dom.bind(window, 'resize', function() { _this.onResize() });
    dom.bind(this.__ul, 'webkitTransitionEnd', function() { _this.onResize(); });
    dom.bind(this.__ul, 'transitionend', function() { _this.onResize() });
    dom.bind(this.__ul, 'oTransitionEnd', function() { _this.onResize() });
    this.onResize();


    if (params.resizable) {
      addResizeHandle(this);
    }

    function saveToLocalStorage() {
      localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
    }

    var root = _this.getRoot();
    function resetWidth() {
        var root = _this.getRoot();
        root.width += 1;
        common.defer(function() {
          root.width -= 1;
        });
      }

      if (!params.parent) {
        resetWidth();
      }

  };

  GUI.toggleHide = function() {

    hide = !hide;
    common.each(hideable_guis, function(gui) {
      gui.domElement.style.zIndex = hide ? -999 : 999;
      gui.domElement.style.opacity = hide ? 0 : 1;
    });
  };

  GUI.CLASS_AUTO_PLACE = 'a';
  GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
  GUI.CLASS_MAIN = 'main';
  GUI.CLASS_CONTROLLER_ROW = 'cr';
  GUI.CLASS_TOO_TALL = 'taller-than-window';
  GUI.CLASS_CLOSED = 'closed';
  GUI.CLASS_CLOSE_BUTTON = 'close-button';
  GUI.CLASS_DRAG = 'drag';

  GUI.DEFAULT_WIDTH = 245;
  GUI.TEXT_CLOSED = 'Close Controls';
  GUI.TEXT_OPEN = 'Open Controls';

  dom.bind(window, 'keydown', function(e) {

    if (document.activeElement.type !== 'text' &&
        (e.which === HIDE_KEY_CODE || e.keyCode == HIDE_KEY_CODE)) {
      GUI.toggleHide();
    }

  }, false);

  common.extend(

      GUI.prototype,

      /** @lends dat.gui.GUI */
      {

        /**
         * @param object
         * @param property
         * @returns {dat.controllers.Controller} The new controller that was added.
         * @instance
         */
        add: function(object, property) {

          return add(
              this,
              object,
              property,
              {
                factoryArgs: Array.prototype.slice.call(arguments, 2)
              }
          );

        },

        /**
         * @param object
         * @param property
         * @returns {dat.controllers.ColorController} The new controller that was added.
         * @instance
         */
        addColor: function(object, property) {

          return add(
              this,
              object,
              property,
              {
                color: true
              }
          );

        },

        /**
         * @param controller
         * @instance
         */
        remove: function(controller) {

          // TODO listening?
          this.__ul.removeChild(controller.__li);
          this.__controllers.slice(this.__controllers.indexOf(controller), 1);
          var _this = this;
          common.defer(function() {
            _this.onResize();
          });

        },

        destroy: function() {

          if (this.autoPlace) {
            auto_place_container.removeChild(this.domElement);
          }

        },

        /**
         * @param name
         * @returns {dat.gui.GUI} The new folder.
         * @throws {Error} if this GUI already has a folder by the specified
         * name
         * @instance
         */
        addFolder: function(name) {

          // We have to prevent collisions on names in order to have a key
          // by which to remember saved values
          if (this.__folders[name] !== undefined) {
            throw new Error('You already have a folder in this GUI by the' +
                ' name "' + name + '"');
          }

          var new_gui_params = { name: name, parent: this };

          // We need to pass down the autoPlace trait so that we can
          // attach event listeners to open/close folder actions to
          // ensure that a scrollbar appears if the window is too short.
          new_gui_params.autoPlace = this.autoPlace;

          // Do we have saved appearance data for this folder?

          if (this.load && // Anything loaded?
              this.load.folders && // Was my parent a dead-end?
              this.load.folders[name]) { // Did daddy remember me?

            // Start me closed if I was closed
            new_gui_params.closed = this.load.folders[name].closed;

            // Pass down the loaded data
            new_gui_params.load = this.load.folders[name];

          }

          var gui = new GUI(new_gui_params);
          this.__folders[name] = gui;

          var li = addRow(this, gui.domElement);
          dom.addClass(li, 'folder');
          return gui;

        },

        open: function() {
          this.closed = false;
        },

        close: function() {
          this.closed = true;
        },

        onResize: function() {

          var root = this.getRoot();

          if (root.scrollable) {

            var top = dom.getOffset(root.__ul).top;
            var h = 0;

            common.each(root.__ul.childNodes, function(node) {
              if (! (root.autoPlace && node === root.__save_row))
                h += dom.getHeight(node);
            });

            if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
              dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
              root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
            } else {
              dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
              root.__ul.style.height = 'auto';
            }

          }

          if (root.__resize_handle) {
            common.defer(function() {
              root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
            });
          }

          if (root.__closeButton) {
            root.__closeButton.style.width = root.width + 'px';
          }

        },

        /**
         * Mark objects for saving. The order of these objects cannot change as
         * the GUI grows. When remembering new objects, append them to the end
         * of the list.
         *
         * @param {Object...} objects
         * @throws {Error} if not called on a top level GUI.
         * @instance
         */
        remember: function() {

          if (common.isUndefined(SAVE_DIALOGUE)) {
            SAVE_DIALOGUE = new CenteredDiv();
            SAVE_DIALOGUE.domElement.innerHTML = saveDialogueContents;
          }

          if (this.parent) {
            throw new Error("You can only call remember on a top level GUI.");
          }

          var _this = this;

          common.each(Array.prototype.slice.call(arguments), function(object) {
            if (_this.__rememberedObjects.length == 0) {
              addSaveMenu(_this);
            }
            if (_this.__rememberedObjects.indexOf(object) == -1) {
              _this.__rememberedObjects.push(object);
            }
          });

          if (this.autoPlace) {
            // Set save row width
            setWidth(this, this.width);
          }

        },

        /**
         * @returns {dat.gui.GUI} the topmost parent GUI of a nested GUI.
         * @instance
         */
        getRoot: function() {
          var gui = this;
          while (gui.parent) {
            gui = gui.parent;
          }
          return gui;
        },

        /**
         * @returns {Object} a JSON object representing the current state of
         * this GUI as well as its remembered properties.
         * @instance
         */
        getSaveObject: function() {

          var toReturn = this.load;

          toReturn.closed = this.closed;

          // Am I remembering any values?
          if (this.__rememberedObjects.length > 0) {

            toReturn.preset = this.preset;

            if (!toReturn.remembered) {
              toReturn.remembered = {};
            }

            toReturn.remembered[this.preset] = getCurrentPreset(this);

          }

          toReturn.folders = {};
          common.each(this.__folders, function(element, key) {
            toReturn.folders[key] = element.getSaveObject();
          });

          return toReturn;

        },

        save: function() {

          if (!this.load.remembered) {
            this.load.remembered = {};
          }

          this.load.remembered[this.preset] = getCurrentPreset(this);
          markPresetModified(this, false);

        },

        saveAs: function(presetName) {

          if (!this.load.remembered) {

            // Retain default values upon first save
            this.load.remembered = {};
            this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);

          }

          this.load.remembered[presetName] = getCurrentPreset(this);
          this.preset = presetName;
          addPresetOption(this, presetName, true);

        },

        revert: function(gui) {

          common.each(this.__controllers, function(controller) {
            // Make revert work on Default.
            if (!this.getRoot().load.remembered) {
              controller.setValue(controller.initialValue);
            } else {
              recallSavedValue(gui || this.getRoot(), controller);
            }
          }, this);

          common.each(this.__folders, function(folder) {
            folder.revert(folder);
          });

          if (!gui) {
            markPresetModified(this.getRoot(), false);
          }


        },

        listen: function(controller) {

          var init = this.__listening.length == 0;
          this.__listening.push(controller);
          if (init) updateDisplays(this.__listening);

        }

      }

  );

  function add(gui, object, property, params) {

    if (object[property] === undefined) {
      throw new Error("Object " + object + " has no property \"" + property + "\"");
    }

    var controller;

    if (params.color) {

      controller = new ColorController(object, property);

    } else {

      var factoryArgs = [object,property].concat(params.factoryArgs);
      controller = controllerFactory.apply(gui, factoryArgs);

    }

    if (params.before instanceof Controller) {
      params.before = params.before.__li;
    }

    recallSavedValue(gui, controller);

    dom.addClass(controller.domElement, 'c');

    var name = document.createElement('span');
    dom.addClass(name, 'property-name');
    name.innerHTML = controller.property;

    var container = document.createElement('div');
    container.appendChild(name);
    container.appendChild(controller.domElement);

    var li = addRow(gui, container, params.before);

    dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);
    dom.addClass(li, typeof controller.getValue());

    augmentController(gui, li, controller);

    gui.__controllers.push(controller);

    return controller;

  }

  /**
   * Add a row to the end of the GUI or before another row.
   *
   * @param gui
   * @param [dom] If specified, inserts the dom content in the new row
   * @param [liBefore] If specified, places the new row before another row
   */
  function addRow(gui, dom, liBefore) {
    var li = document.createElement('li');
    if (dom) li.appendChild(dom);
    if (liBefore) {
      gui.__ul.insertBefore(li, params.before);
    } else {
      gui.__ul.appendChild(li);
    }
    gui.onResize();
    return li;
  }

  function augmentController(gui, li, controller) {

    controller.__li = li;
    controller.__gui = gui;

    common.extend(controller, {

      options: function(options) {

        if (arguments.length > 1) {
          controller.remove();

          return add(
              gui,
              controller.object,
              controller.property,
              {
                before: controller.__li.nextElementSibling,
                factoryArgs: [common.toArray(arguments)]
              }
          );

        }

        if (common.isArray(options) || common.isObject(options)) {
          controller.remove();

          return add(
              gui,
              controller.object,
              controller.property,
              {
                before: controller.__li.nextElementSibling,
                factoryArgs: [options]
              }
          );

        }

      },

      name: function(v) {
        controller.__li.firstElementChild.firstElementChild.innerHTML = v;
        return controller;
      },

      listen: function() {
        controller.__gui.listen(controller);
        return controller;
      },

      remove: function() {
        controller.__gui.remove(controller);
        return controller;
      }

    });

    // All sliders should be accompanied by a box.
    if (controller instanceof NumberControllerSlider) {

      var box = new NumberControllerBox(controller.object, controller.property,
          { min: controller.__min, max: controller.__max, step: controller.__step });

      common.each(['updateDisplay', 'onChange', 'onFinishChange'], function(method) {
        var pc = controller[method];
        var pb = box[method];
        controller[method] = box[method] = function() {
          var args = Array.prototype.slice.call(arguments);
          pc.apply(controller, args);
          return pb.apply(box, args);
        }
      });

      dom.addClass(li, 'has-slider');
      controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);

    }
    else if (controller instanceof NumberControllerBox) {

      var r = function(returned) {

        // Have we defined both boundaries?
        if (common.isNumber(controller.__min) && common.isNumber(controller.__max)) {

          // Well, then lets just replace this with a slider.
          controller.remove();
          return add(
              gui,
              controller.object,
              controller.property,
              {
                before: controller.__li.nextElementSibling,
                factoryArgs: [controller.__min, controller.__max, controller.__step]
              });

        }

        return returned;

      };

      controller.min = common.compose(r, controller.min);
      controller.max = common.compose(r, controller.max);

    }
    else if (controller instanceof BooleanController) {

      dom.bind(li, 'click', function() {
        dom.fakeEvent(controller.__checkbox, 'click');
      });

      dom.bind(controller.__checkbox, 'click', function(e) {
        e.stopPropagation(); // Prevents double-toggle
      })

    }
    else if (controller instanceof FunctionController) {

      dom.bind(li, 'click', function() {
        dom.fakeEvent(controller.__button, 'click');
      });

      dom.bind(li, 'mouseover', function() {
        dom.addClass(controller.__button, 'hover');
      });

      dom.bind(li, 'mouseout', function() {
        dom.removeClass(controller.__button, 'hover');
      });

    }
    else if (controller instanceof ColorController) {

      dom.addClass(li, 'color');
      controller.updateDisplay = common.compose(function(r) {
        li.style.borderLeftColor = controller.__color.toString();
        return r;
      }, controller.updateDisplay);

      controller.updateDisplay();

    }

    controller.setValue = common.compose(function(r) {
      if (gui.getRoot().__preset_select && controller.isModified()) {
        markPresetModified(gui.getRoot(), true);
      }
      return r;
    }, controller.setValue);

  }

  function recallSavedValue(gui, controller) {

    // Find the topmost GUI, that's where remembered objects live.
    var root = gui.getRoot();

    // Does the object we're controlling match anything we've been told to
    // remember?
    var matched_index = root.__rememberedObjects.indexOf(controller.object);

    // Why yes, it does!
    if (matched_index != -1) {

      // Let me fetch a map of controllers for thcommon.isObject.
      var controller_map =
          root.__rememberedObjectIndecesToControllers[matched_index];

      // Ohp, I believe this is the first controller we've created for this
      // object. Lets make the map fresh.
      if (controller_map === undefined) {
        controller_map = {};
        root.__rememberedObjectIndecesToControllers[matched_index] =
            controller_map;
      }

      // Keep track of this controller
      controller_map[controller.property] = controller;

      // Okay, now have we saved any values for this controller?
      if (root.load && root.load.remembered) {

        var preset_map = root.load.remembered;

        // Which preset are we trying to load?
        var preset;

        if (preset_map[gui.preset]) {

          preset = preset_map[gui.preset];

        } else if (preset_map[DEFAULT_DEFAULT_PRESET_NAME]) {

          // Uhh, you can have the default instead?
          preset = preset_map[DEFAULT_DEFAULT_PRESET_NAME];

        } else {

          // Nada.

          return;

        }


        // Did the loaded object remember thcommon.isObject?
        if (preset[matched_index] &&

          // Did we remember this particular property?
            preset[matched_index][controller.property] !== undefined) {

          // We did remember something for this guy ...
          var value = preset[matched_index][controller.property];

          // And that's what it is.
          controller.initialValue = value;
          controller.setValue(value);

        }

      }

    }

  }

  function getLocalStorageHash(gui, key) {
    // TODO how does this deal with multiple GUI's?
    return document.location.href + '.' + key;

  }

  function addSaveMenu(gui) {

    var div = gui.__save_row = document.createElement('li');

    dom.addClass(gui.domElement, 'has-save');

    gui.__ul.insertBefore(div, gui.__ul.firstChild);

    dom.addClass(div, 'save-row');

    var gears = document.createElement('span');
    gears.innerHTML = '&nbsp;';
    dom.addClass(gears, 'button gears');

    // TODO replace with FunctionController
    var button = document.createElement('span');
    button.innerHTML = 'Save';
    dom.addClass(button, 'button');
    dom.addClass(button, 'save');

    var button2 = document.createElement('span');
    button2.innerHTML = 'New';
    dom.addClass(button2, 'button');
    dom.addClass(button2, 'save-as');

    var button3 = document.createElement('span');
    button3.innerHTML = 'Revert';
    dom.addClass(button3, 'button');
    dom.addClass(button3, 'revert');

    var select = gui.__preset_select = document.createElement('select');

    if (gui.load && gui.load.remembered) {

      common.each(gui.load.remembered, function(value, key) {
        addPresetOption(gui, key, key == gui.preset);
      });

    } else {
      addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
    }

    dom.bind(select, 'change', function() {


      for (var index = 0; index < gui.__preset_select.length; index++) {
        gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
      }

      gui.preset = this.value;

    });

    div.appendChild(select);
    div.appendChild(gears);
    div.appendChild(button);
    div.appendChild(button2);
    div.appendChild(button3);

    if (SUPPORTS_LOCAL_STORAGE) {

      var saveLocally = document.getElementById('dg-save-locally');
      var explain = document.getElementById('dg-local-explain');

      saveLocally.style.display = 'block';

      var localStorageCheckBox = document.getElementById('dg-local-storage');

      if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
        localStorageCheckBox.setAttribute('checked', 'checked');
      }

      function showHideExplain() {
        explain.style.display = gui.useLocalStorage ? 'block' : 'none';
      }

      showHideExplain();

      // TODO: Use a boolean controller, fool!
      dom.bind(localStorageCheckBox, 'change', function() {
        gui.useLocalStorage = !gui.useLocalStorage;
        showHideExplain();
      });

    }

    var newConstructorTextArea = document.getElementById('dg-new-constructor');

    dom.bind(newConstructorTextArea, 'keydown', function(e) {
      if (e.metaKey && (e.which === 67 || e.keyCode == 67)) {
        SAVE_DIALOGUE.hide();
      }
    });

    dom.bind(gears, 'click', function() {
      newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
      SAVE_DIALOGUE.show();
      newConstructorTextArea.focus();
      newConstructorTextArea.select();
    });

    dom.bind(button, 'click', function() {
      gui.save();
    });

    dom.bind(button2, 'click', function() {
      var presetName = prompt('Enter a new preset name.');
      if (presetName) gui.saveAs(presetName);
    });

    dom.bind(button3, 'click', function() {
      gui.revert();
    });

//    div.appendChild(button2);

  }

  function addResizeHandle(gui) {

    gui.__resize_handle = document.createElement('div');

    common.extend(gui.__resize_handle.style, {

      width: '6px',
      marginLeft: '-3px',
      height: '200px',
      cursor: 'ew-resize',
      position: 'absolute'
//      border: '1px solid blue'

    });

    var pmouseX;

    dom.bind(gui.__resize_handle, 'mousedown', dragStart);
    dom.bind(gui.__closeButton, 'mousedown', dragStart);

    gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);

    function dragStart(e) {

      e.preventDefault();

      pmouseX = e.clientX;

      dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.bind(window, 'mousemove', drag);
      dom.bind(window, 'mouseup', dragStop);

      return false;

    }

    function drag(e) {

      e.preventDefault();

      gui.width += pmouseX - e.clientX;
      gui.onResize();
      pmouseX = e.clientX;

      return false;

    }

    function dragStop() {

      dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.unbind(window, 'mousemove', drag);
      dom.unbind(window, 'mouseup', dragStop);

    }

  }

  function setWidth(gui, w) {
    gui.domElement.style.width = w + 'px';
    // Auto placed save-rows are position fixed, so we have to
    // set the width manually if we want it to bleed to the edge
    if (gui.__save_row && gui.autoPlace) {
      gui.__save_row.style.width = w + 'px';
    }if (gui.__closeButton) {
      gui.__closeButton.style.width = w + 'px';
    }
  }

  function getCurrentPreset(gui, useInitialValues) {

    var toReturn = {};

    // For each object I'm remembering
    common.each(gui.__rememberedObjects, function(val, index) {

      var saved_values = {};

      // The controllers I've made for thcommon.isObject by property
      var controller_map =
          gui.__rememberedObjectIndecesToControllers[index];

      // Remember each value for each property
      common.each(controller_map, function(controller, property) {
        saved_values[property] = useInitialValues ? controller.initialValue : controller.getValue();
      });

      // Save the values for thcommon.isObject
      toReturn[index] = saved_values;

    });

    return toReturn;

  }

  function addPresetOption(gui, name, setSelected) {
    var opt = document.createElement('option');
    opt.innerHTML = name;
    opt.value = name;
    gui.__preset_select.appendChild(opt);
    if (setSelected) {
      gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
    }
  }

  function setPresetSelectIndex(gui) {
    for (var index = 0; index < gui.__preset_select.length; index++) {
      if (gui.__preset_select[index].value == gui.preset) {
        gui.__preset_select.selectedIndex = index;
      }
    }
  }

  function markPresetModified(gui, modified) {
    var opt = gui.__preset_select[gui.__preset_select.selectedIndex];
//    console.log('mark', modified, opt);
    if (modified) {
      opt.innerHTML = opt.value + "*";
    } else {
      opt.innerHTML = opt.value;
    }
  }

  function updateDisplays(controllerArray) {


    if (controllerArray.length != 0) {

      requestAnimationFrame(function() {
        updateDisplays(controllerArray);
      });

    }

    common.each(controllerArray, function(c) {
      c.updateDisplay();
    });

  }

  return GUI;

})(dat.utils.css,
"<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n      \n    </div>\n    \n  </div>\n\n</div>",
".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity 0.1s linear;-o-transition:opacity 0.1s linear;-moz-transition:opacity 0.1s linear;transition:opacity 0.1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity 0.1s linear;-o-transition:opacity 0.1s linear;-moz-transition:opacity 0.1s linear;transition:opacity 0.1s linear;border:0;position:absolute;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-x:hidden}.dg.a.has-save ul{margin-top:27px}.dg.a.has-save ul.closed{margin-top:0}.dg.a .save-row{position:fixed;top:0;z-index:1002}.dg li{-webkit-transition:height 0.1s ease-out;-o-transition:height 0.1s ease-out;-moz-transition:height 0.1s ease-out;transition:height 0.1s ease-out}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;overflow:hidden;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li > *{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:9px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2fa1d6}.dg .cr.number input[type=text]{color:#2fa1d6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2fa1d6}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n",
dat.controllers.factory = (function (OptionController, NumberControllerBox, NumberControllerSlider, StringController, FunctionController, BooleanController, common) {

      return function(object, property) {

        var initialValue = object[property];

        // Providing options?
        if (common.isArray(arguments[2]) || common.isObject(arguments[2])) {
          return new OptionController(object, property, arguments[2]);
        }

        // Providing a map?

        if (common.isNumber(initialValue)) {

          if (common.isNumber(arguments[2]) && common.isNumber(arguments[3])) {

            // Has min and max.
            return new NumberControllerSlider(object, property, arguments[2], arguments[3]);

          } else {

            return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3] });

          }

        }

        if (common.isString(initialValue)) {
          return new StringController(object, property);
        }

        if (common.isFunction(initialValue)) {
          return new FunctionController(object, property, '');
        }

        if (common.isBoolean(initialValue)) {
          return new BooleanController(object, property);
        }

      }

    })(dat.controllers.OptionController,
dat.controllers.NumberControllerBox,
dat.controllers.NumberControllerSlider,
dat.controllers.StringController = (function (Controller, dom, common) {

  /**
   * @class Provides a text input to alter the string property of an object.
   *
   * @extends dat.controllers.Controller
   *
   * @param {Object} object The object to be manipulated
   * @param {string} property The name of the property to be manipulated
   *
   * @member dat.controllers
   */
  var StringController = function(object, property) {

    StringController.superclass.call(this, object, property);

    var _this = this;

    this.__input = document.createElement('input');
    this.__input.setAttribute('type', 'text');

    dom.bind(this.__input, 'keyup', onChange);
    dom.bind(this.__input, 'change', onChange);
    dom.bind(this.__input, 'blur', onBlur);
    dom.bind(this.__input, 'keydown', function(e) {
      if (e.keyCode === 13) {
        this.blur();
      }
    });
    

    function onChange() {
      _this.setValue(_this.__input.value);
    }

    function onBlur() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    this.updateDisplay();

    this.domElement.appendChild(this.__input);

  };

  StringController.superclass = Controller;

  common.extend(

      StringController.prototype,
      Controller.prototype,

      {

        updateDisplay: function() {
          // Stops the caret from moving on account of:
          // keyup -> setValue -> updateDisplay
          if (!dom.isActive(this.__input)) {
            this.__input.value = this.getValue();
          }
          return StringController.superclass.prototype.updateDisplay.call(this);
        }

      }

  );

  return StringController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.utils.common),
dat.controllers.FunctionController,
dat.controllers.BooleanController,
dat.utils.common),
dat.controllers.Controller,
dat.controllers.BooleanController,
dat.controllers.FunctionController,
dat.controllers.NumberControllerBox,
dat.controllers.NumberControllerSlider,
dat.controllers.OptionController,
dat.controllers.ColorController = (function (Controller, dom, Color, interpret, common) {

  var ColorController = function(object, property) {

    ColorController.superclass.call(this, object, property);

    this.__color = new Color(this.getValue());
    this.__temp = new Color(0);

    var _this = this;

    this.domElement = document.createElement('div');

    dom.makeSelectable(this.domElement, false);

    this.__selector = document.createElement('div');
    this.__selector.className = 'selector';

    this.__saturation_field = document.createElement('div');
    this.__saturation_field.className = 'saturation-field';

    this.__field_knob = document.createElement('div');
    this.__field_knob.className = 'field-knob';
    this.__field_knob_border = '2px solid ';

    this.__hue_knob = document.createElement('div');
    this.__hue_knob.className = 'hue-knob';

    this.__hue_field = document.createElement('div');
    this.__hue_field.className = 'hue-field';

    this.__input = document.createElement('input');
    this.__input.type = 'text';
    this.__input_textShadow = '0 1px 1px ';

    dom.bind(this.__input, 'keydown', function(e) {
      if (e.keyCode === 13) { // on enter
        onBlur.call(this);
      }
    });

    dom.bind(this.__input, 'blur', onBlur);

    dom.bind(this.__selector, 'mousedown', function(e) {

      dom
        .addClass(this, 'drag')
        .bind(window, 'mouseup', function(e) {
          dom.removeClass(_this.__selector, 'drag');
        });

    });

    var value_field = document.createElement('div');

    common.extend(this.__selector.style, {
      width: '122px',
      height: '102px',
      padding: '3px',
      backgroundColor: '#222',
      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
    });

    common.extend(this.__field_knob.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      border: this.__field_knob_border + (this.__color.v < .5 ? '#fff' : '#000'),
      boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
      borderRadius: '12px',
      zIndex: 1
    });
    
    common.extend(this.__hue_knob.style, {
      position: 'absolute',
      width: '15px',
      height: '2px',
      borderRight: '4px solid #fff',
      zIndex: 1
    });

    common.extend(this.__saturation_field.style, {
      width: '100px',
      height: '100px',
      border: '1px solid #555',
      marginRight: '3px',
      display: 'inline-block',
      cursor: 'pointer'
    });

    common.extend(value_field.style, {
      width: '100%',
      height: '100%',
      background: 'none'
    });
    
    linearGradient(value_field, 'top', 'rgba(0,0,0,0)', '#000');

    common.extend(this.__hue_field.style, {
      width: '15px',
      height: '100px',
      display: 'inline-block',
      border: '1px solid #555',
      cursor: 'ns-resize'
    });

    hueGradient(this.__hue_field);

    common.extend(this.__input.style, {
      outline: 'none',
//      width: '120px',
      textAlign: 'center',
//      padding: '4px',
//      marginBottom: '6px',
      color: '#fff',
      border: 0,
      fontWeight: 'bold',
      textShadow: this.__input_textShadow + 'rgba(0,0,0,0.7)'
    });

    dom.bind(this.__saturation_field, 'mousedown', fieldDown);
    dom.bind(this.__field_knob, 'mousedown', fieldDown);

    dom.bind(this.__hue_field, 'mousedown', function(e) {
      setH(e);
      dom.bind(window, 'mousemove', setH);
      dom.bind(window, 'mouseup', unbindH);
    });

    function fieldDown(e) {
      setSV(e);
      // document.body.style.cursor = 'none';
      dom.bind(window, 'mousemove', setSV);
      dom.bind(window, 'mouseup', unbindSV);
    }

    function unbindSV() {
      dom.unbind(window, 'mousemove', setSV);
      dom.unbind(window, 'mouseup', unbindSV);
      // document.body.style.cursor = 'default';
    }

    function onBlur() {
      var i = interpret(this.value);
      if (i !== false) {
        _this.__color.__state = i;
        _this.setValue(_this.__color.toOriginal());
      } else {
        this.value = _this.__color.toString();
      }
    }

    function unbindH() {
      dom.unbind(window, 'mousemove', setH);
      dom.unbind(window, 'mouseup', unbindH);
    }

    this.__saturation_field.appendChild(value_field);
    this.__selector.appendChild(this.__field_knob);
    this.__selector.appendChild(this.__saturation_field);
    this.__selector.appendChild(this.__hue_field);
    this.__hue_field.appendChild(this.__hue_knob);

    this.domElement.appendChild(this.__input);
    this.domElement.appendChild(this.__selector);

    this.updateDisplay();

    function setSV(e) {

      e.preventDefault();

      var w = dom.getWidth(_this.__saturation_field);
      var o = dom.getOffset(_this.__saturation_field);
      var s = (e.clientX - o.left + document.body.scrollLeft) / w;
      var v = 1 - (e.clientY - o.top + document.body.scrollTop) / w;

      if (v > 1) v = 1;
      else if (v < 0) v = 0;

      if (s > 1) s = 1;
      else if (s < 0) s = 0;

      _this.__color.v = v;
      _this.__color.s = s;

      _this.setValue(_this.__color.toOriginal());


      return false;

    }

    function setH(e) {

      e.preventDefault();

      var s = dom.getHeight(_this.__hue_field);
      var o = dom.getOffset(_this.__hue_field);
      var h = 1 - (e.clientY - o.top + document.body.scrollTop) / s;

      if (h > 1) h = 1;
      else if (h < 0) h = 0;

      _this.__color.h = h * 360;

      _this.setValue(_this.__color.toOriginal());

      return false;

    }

  };

  ColorController.superclass = Controller;

  common.extend(

      ColorController.prototype,
      Controller.prototype,

      {

        updateDisplay: function() {

          var i = interpret(this.getValue());

          if (i !== false) {

            var mismatch = false;

            // Check for mismatch on the interpreted value.

            common.each(Color.COMPONENTS, function(component) {
              if (!common.isUndefined(i[component]) &&
                  !common.isUndefined(this.__color.__state[component]) &&
                  i[component] !== this.__color.__state[component]) {
                mismatch = true;
                return {}; // break
              }
            }, this);

            // If nothing diverges, we keep our previous values
            // for statefulness, otherwise we recalculate fresh
            if (mismatch) {
              common.extend(this.__color.__state, i);
            }

          }

          common.extend(this.__temp.__state, this.__color.__state);

          this.__temp.a = 1;

          var flip = (this.__color.v < .5 || this.__color.s > .5) ? 255 : 0;
          var _flip = 255 - flip;

          common.extend(this.__field_knob.style, {
            marginLeft: 100 * this.__color.s - 7 + 'px',
            marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
            backgroundColor: this.__temp.toString(),
            border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip +')'
          });

          this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px'

          this.__temp.s = 1;
          this.__temp.v = 1;

          linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toString());

          common.extend(this.__input.style, {
            backgroundColor: this.__input.value = this.__color.toString(),
            color: 'rgb(' + flip + ',' + flip + ',' + flip +')',
            textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip +',.7)'
          });

        }

      }

  );
  
  var vendors = ['-moz-','-o-','-webkit-','-ms-',''];
  
  function linearGradient(elem, x, a, b) {
    elem.style.background = '';
    common.each(vendors, function(vendor) {
      elem.style.cssText += 'background: ' + vendor + 'linear-gradient('+x+', '+a+' 0%, ' + b + ' 100%); ';
    });
  }
  
  function hueGradient(elem) {
    elem.style.background = '';
    elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);'
    elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
    elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
    elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
    elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
  }


  return ColorController;

})(dat.controllers.Controller,
dat.dom.dom,
dat.color.Color = (function (interpret, math, toString, common) {

  var Color = function() {

    this.__state = interpret.apply(this, arguments);

    if (this.__state === false) {
      throw 'Failed to interpret color arguments';
    }

    this.__state.a = this.__state.a || 1;


  };

  Color.COMPONENTS = ['r','g','b','h','s','v','hex','a'];

  common.extend(Color.prototype, {

    toString: function() {
      return toString(this);
    },

    toOriginal: function() {
      return this.__state.conversion.write(this);
    }

  });

  defineRGBComponent(Color.prototype, 'r', 2);
  defineRGBComponent(Color.prototype, 'g', 1);
  defineRGBComponent(Color.prototype, 'b', 0);

  defineHSVComponent(Color.prototype, 'h');
  defineHSVComponent(Color.prototype, 's');
  defineHSVComponent(Color.prototype, 'v');

  Object.defineProperty(Color.prototype, 'a', {

    get: function() {
      return this.__state.a;
    },

    set: function(v) {
      this.__state.a = v;
    }

  });

  Object.defineProperty(Color.prototype, 'hex', {

    get: function() {

      if (!this.__state.space !== 'HEX') {
        this.__state.hex = math.rgb_to_hex(this.r, this.g, this.b);
      }

      return this.__state.hex;

    },

    set: function(v) {

      this.__state.space = 'HEX';
      this.__state.hex = v;

    }

  });

  function defineRGBComponent(target, component, componentHexIndex) {

    Object.defineProperty(target, component, {

      get: function() {

        if (this.__state.space === 'RGB') {
          return this.__state[component];
        }

        recalculateRGB(this, component, componentHexIndex);

        return this.__state[component];

      },

      set: function(v) {

        if (this.__state.space !== 'RGB') {
          recalculateRGB(this, component, componentHexIndex);
          this.__state.space = 'RGB';
        }

        this.__state[component] = v;

      }

    });

  }

  function defineHSVComponent(target, component) {

    Object.defineProperty(target, component, {

      get: function() {

        if (this.__state.space === 'HSV')
          return this.__state[component];

        recalculateHSV(this);

        return this.__state[component];

      },

      set: function(v) {

        if (this.__state.space !== 'HSV') {
          recalculateHSV(this);
          this.__state.space = 'HSV';
        }

        this.__state[component] = v;

      }

    });

  }

  function recalculateRGB(color, component, componentHexIndex) {

    if (color.__state.space === 'HEX') {

      color.__state[component] = math.component_from_hex(color.__state.hex, componentHexIndex);

    } else if (color.__state.space === 'HSV') {

      common.extend(color.__state, math.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));

    } else {

      throw 'Corrupted color state';

    }

  }

  function recalculateHSV(color) {

    var result = math.rgb_to_hsv(color.r, color.g, color.b);

    common.extend(color.__state,
        {
          s: result.s,
          v: result.v
        }
    );

    if (!common.isNaN(result.h)) {
      color.__state.h = result.h;
    } else if (common.isUndefined(color.__state.h)) {
      color.__state.h = 0;
    }

  }

  return Color;

})(dat.color.interpret,
dat.color.math = (function () {

  var tmpComponent;

  return {

    hsv_to_rgb: function(h, s, v) {

      var hi = Math.floor(h / 60) % 6;

      var f = h / 60 - Math.floor(h / 60);
      var p = v * (1.0 - s);
      var q = v * (1.0 - (f * s));
      var t = v * (1.0 - ((1.0 - f) * s));
      var c = [
        [v, t, p],
        [q, v, p],
        [p, v, t],
        [p, q, v],
        [t, p, v],
        [v, p, q]
      ][hi];

      return {
        r: c[0] * 255,
        g: c[1] * 255,
        b: c[2] * 255
      };

    },

    rgb_to_hsv: function(r, g, b) {

      var min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          delta = max - min,
          h, s;

      if (max != 0) {
        s = delta / max;
      } else {
        return {
          h: NaN,
          s: 0,
          v: 0
        };
      }

      if (r == max) {
        h = (g - b) / delta;
      } else if (g == max) {
        h = 2 + (b - r) / delta;
      } else {
        h = 4 + (r - g) / delta;
      }
      h /= 6;
      if (h < 0) {
        h += 1;
      }

      return {
        h: h * 360,
        s: s,
        v: max / 255
      };
    },

    rgb_to_hex: function(r, g, b) {
      var hex = this.hex_with_component(0, 2, r);
      hex = this.hex_with_component(hex, 1, g);
      hex = this.hex_with_component(hex, 0, b);
      return hex;
    },

    component_from_hex: function(hex, componentIndex) {
      return (hex >> (componentIndex * 8)) & 0xFF;
    },

    hex_with_component: function(hex, componentIndex, value) {
      return value << (tmpComponent = componentIndex * 8) | (hex & ~ (0xFF << tmpComponent));
    }

  }

})(),
dat.color.toString,
dat.utils.common),
dat.color.interpret,
dat.utils.common),
dat.utils.requestAnimationFrame = (function () {

  /**
   * requirejs version of Paul Irish's RequestAnimationFrame
   * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
   */

  return window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback, element) {

        window.setTimeout(callback, 1000 / 60);

      };
})(),
dat.dom.CenteredDiv = (function (dom, common) {


  var CenteredDiv = function() {

    this.backgroundElement = document.createElement('div');
    common.extend(this.backgroundElement.style, {
      backgroundColor: 'rgba(0,0,0,0.8)',
      top: 0,
      left: 0,
      display: 'none',
      zIndex: '1000',
      opacity: 0,
      WebkitTransition: 'opacity 0.2s linear'
    });

    dom.makeFullscreen(this.backgroundElement);
    this.backgroundElement.style.position = 'fixed';

    this.domElement = document.createElement('div');
    common.extend(this.domElement.style, {
      position: 'fixed',
      display: 'none',
      zIndex: '1001',
      opacity: 0,
      WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear'
    });


    document.body.appendChild(this.backgroundElement);
    document.body.appendChild(this.domElement);

    var _this = this;
    dom.bind(this.backgroundElement, 'click', function() {
      _this.hide();
    });


  };

  CenteredDiv.prototype.show = function() {

    var _this = this;
    


    this.backgroundElement.style.display = 'block';

    this.domElement.style.display = 'block';
    this.domElement.style.opacity = 0;
//    this.domElement.style.top = '52%';
    this.domElement.style.webkitTransform = 'scale(1.1)';

    this.layout();

    common.defer(function() {
      _this.backgroundElement.style.opacity = 1;
      _this.domElement.style.opacity = 1;
      _this.domElement.style.webkitTransform = 'scale(1)';
    });

  };

  CenteredDiv.prototype.hide = function() {

    var _this = this;

    var hide = function() {

      _this.domElement.style.display = 'none';
      _this.backgroundElement.style.display = 'none';

      dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
      dom.unbind(_this.domElement, 'transitionend', hide);
      dom.unbind(_this.domElement, 'oTransitionEnd', hide);

    };

    dom.bind(this.domElement, 'webkitTransitionEnd', hide);
    dom.bind(this.domElement, 'transitionend', hide);
    dom.bind(this.domElement, 'oTransitionEnd', hide);

    this.backgroundElement.style.opacity = 0;
//    this.domElement.style.top = '48%';
    this.domElement.style.opacity = 0;
    this.domElement.style.webkitTransform = 'scale(1.1)';

  };

  CenteredDiv.prototype.layout = function() {
    this.domElement.style.left = window.innerWidth/2 - dom.getWidth(this.domElement) / 2 + 'px';
    this.domElement.style.top = window.innerHeight/2 - dom.getHeight(this.domElement) / 2 + 'px';
  };
  
  function lockScroll(e) {
    console.log(e);
  }

  return CenteredDiv;

})(dat.dom.dom,
dat.utils.common),
dat.dom.dom,
dat.utils.common);
},{}],4:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/*! @license Firebase v3.5.2
    Build: 3.5.2-rc.1
    Terms: https://developers.google.com/terms */
var firebase = null; (function() { for(var aa="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(c.get||c.set)throw new TypeError("ES3 does not support getters and setters.");a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)},h="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global&&null!=global?global:this,ba=function(){ba=function(){};h.Symbol||(h.Symbol=ca)},da=0,ca=function(a){return"jscomp_symbol_"+(a||"")+da++},m=function(){ba();var a=h.Symbol.iterator;a||(a=h.Symbol.iterator=
h.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&aa(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return ea(this)}});m=function(){}},ea=function(a){var b=0;return fa(function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}})},fa=function(a){m();a={next:a};a[h.Symbol.iterator]=function(){return this};return a},n=function(a){m();var b=a[Symbol.iterator];return b?b.call(a):ea(a)},p=h,q=["Promise"],r=0;r<q.length-1;r++){var t=q[r];t in p||(p[t]={});p=p[t]}
var ga=q[q.length-1],u=p[ga],w=function(){function a(){this.c=null}if(u)return u;a.prototype.L=function(a){null==this.c&&(this.c=[],this.W());this.c.push(a)};a.prototype.W=function(){var a=this;this.M(function(){a.$()})};var b=h.setTimeout;a.prototype.M=function(a){b(a,0)};a.prototype.$=function(){for(;this.c&&this.c.length;){var a=this.c;this.c=[];for(var b=0;b<a.length;++b){var c=a[b];delete a[b];try{c()}catch(k){this.X(k)}}}this.c=null};a.prototype.X=function(a){this.M(function(){throw a;})};var c=
function(a){this.a=0;this.j=void 0;this.m=[];var b=this.F();try{a(b.resolve,b.reject)}catch(g){b.reject(g)}};c.prototype.F=function(){function a(a){return function(e){c||(c=!0,a.call(b,e))}}var b=this,c=!1;return{resolve:a(this.ia),reject:a(this.K)}};c.prototype.ia=function(a){if(a===this)this.K(new TypeError("A Promise cannot resolve to itself"));else if(a instanceof c)this.la(a);else{var b;a:switch(typeof a){case "object":b=null!=a;break a;case "function":b=!0;break a;default:b=!1}b?this.ha(a):
this.R(a)}};c.prototype.ha=function(a){var b=void 0;try{b=a.then}catch(g){this.K(g);return}"function"==typeof b?this.ma(b,a):this.R(a)};c.prototype.K=function(a){this.U(2,a)};c.prototype.R=function(a){this.U(1,a)};c.prototype.U=function(a,b){if(0!=this.a)throw Error("Cannot settle("+a+", "+b|"): Promise already settled in state"+this.a);this.a=a;this.j=b;this.ba()};c.prototype.ba=function(){if(null!=this.m){for(var a=this.m,b=0;b<a.length;++b)a[b].call(),a[b]=null;this.m=null}};var d=new a;c.prototype.la=
function(a){var b=this.F();a.o(b.resolve,b.reject)};c.prototype.ma=function(a,b){var c=this.F();try{a.call(b,c.resolve,c.reject)}catch(k){c.reject(k)}};c.prototype.then=function(a,b){function e(a,b){return"function"==typeof a?function(b){try{d(a(b))}catch(Fa){f(Fa)}}:b}var d,f,z=new c(function(a,b){d=a;f=b});this.o(e(a,d),e(b,f));return z};c.prototype.catch=function(a){return this.then(void 0,a)};c.prototype.o=function(a,b){function c(){switch(e.a){case 1:a(e.j);break;case 2:b(e.j);break;default:throw Error("Unexpected state: "+
e.a);}}var e=this;null==this.m?d.L(c):this.m.push(function(){d.L(c)})};c.resolve=function(a){return a instanceof c?a:new c(function(b){b(a)})};c.reject=function(a){return new c(function(b,c){c(a)})};c.race=function(a){return new c(function(b,d){for(var e=n(a),f=e.next();!f.done;f=e.next())c.resolve(f.value).o(b,d)})};c.all=function(a){var b=n(a),d=b.next();return d.done?c.resolve([]):new c(function(a,e){function k(b){return function(c){f[b]=c;l--;0==l&&a(f)}}var f=[],l=0;do f.push(void 0),l++,c.resolve(d.value).o(k(f.length-
1),e),d=b.next();while(!d.done)})};c.$jscomp$new$AsyncExecutor=function(){return new a};return c}();w!=u&&null!=w&&aa(p,ga,{configurable:!0,writable:!0,value:w});
var x=this,y=function(){},ha=function(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b},A=function(a){return"function"==ha(a)},ia=function(a,b,c){return a.call.apply(a.bind,arguments)},ja=function(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}},B=function(a,b,c){B=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?
ia:ja;return B.apply(null,arguments)},ka=function(a,b){var c=Array.prototype.slice.call(arguments,1);return function(){var b=c.slice();b.push.apply(b,arguments);return a.apply(this,b)}},la=function(a,b){function c(){}c.prototype=b.prototype;a.sa=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.ra=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};var C;C="undefined"!==typeof window?window:"undefined"!==typeof self?self:global;function __extends(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);a.prototype=null===b?Object.create(b):(c.prototype=b.prototype,new c)}
function __decorate(a,b,c,d){var e=arguments.length,f=3>e?b:null===d?d=Object.getOwnPropertyDescriptor(b,c):d,g;g=C.Reflect;if("object"===typeof g&&"function"===typeof g.decorate)f=g.decorate(a,b,c,d);else for(var k=a.length-1;0<=k;k--)if(g=a[k])f=(3>e?g(f):3<e?g(b,c,f):g(b,c))||f;return 3<e&&f&&Object.defineProperty(b,c,f),f}function __metadata(a,b){var c=C.Reflect;if("object"===typeof c&&"function"===typeof c.metadata)return c.metadata(a,b)}
var __param=function(a,b){return function(c,d){b(c,d,a)}},__awaiter=function(a,b,c,d){return new (c||(c=Promise))(function(e,f){function g(a){try{l(d.next(a))}catch(v){f(v)}}function k(a){try{l(d.throw(a))}catch(v){f(v)}}function l(a){a.done?e(a.value):(new c(function(b){b(a.value)})).then(g,k)}l((d=d.apply(a,b)).next())})};"undefined"!==typeof C.V&&C.V||(C.__extends=__extends,C.__decorate=__decorate,C.__metadata=__metadata,C.__param=__param,C.__awaiter=__awaiter);var D=function(a){if(Error.captureStackTrace)Error.captureStackTrace(this,D);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))};la(D,Error);D.prototype.name="CustomError";var ma=function(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};var E=function(a,b){b.unshift(a);D.call(this,ma.apply(null,b));b.shift()};la(E,D);E.prototype.name="AssertionError";var na=function(a,b,c,d){var e="Assertion failed";if(c)var e=e+(": "+c),f=d;else a&&(e+=": "+a,f=b);throw new E(""+e,f||[]);},F=function(a,b,c){a||na("",null,b,Array.prototype.slice.call(arguments,2))},G=function(a,b,c){A(a)||na("Expected function but got %s: %s.",[ha(a),a],b,Array.prototype.slice.call(arguments,2))};var H=function(a,b,c){this.ea=c;this.Y=a;this.ga=b;this.A=0;this.w=null};H.prototype.get=function(){var a;0<this.A?(this.A--,a=this.w,this.w=a.next,a.next=null):a=this.Y();return a};H.prototype.put=function(a){this.ga(a);this.A<this.ea&&(this.A++,a.next=this.w,this.w=a)};var I;a:{var oa=x.navigator;if(oa){var pa=oa.userAgent;if(pa){I=pa;break a}}I=""};var qa=function(a){x.setTimeout(function(){throw a;},0)},J,ra=function(){var a=x.MessageChannel;"undefined"===typeof a&&"undefined"!==typeof window&&window.postMessage&&window.addEventListener&&-1==I.indexOf("Presto")&&(a=function(){var a=document.createElement("IFRAME");a.style.display="none";a.src="";document.documentElement.appendChild(a);var b=a.contentWindow,a=b.document;a.open();a.write("");a.close();var c="callImmediate"+Math.random(),d="file:"==b.location.protocol?"*":b.location.protocol+
"//"+b.location.host,a=B(function(a){if(("*"==d||a.origin==d)&&a.data==c)this.port1.onmessage()},this);b.addEventListener("message",a,!1);this.port1={};this.port2={postMessage:function(){b.postMessage(c,d)}}});if("undefined"!==typeof a&&-1==I.indexOf("Trident")&&-1==I.indexOf("MSIE")){var b=new a,c={},d=c;b.port1.onmessage=function(){if(void 0!==c.next){c=c.next;var a=c.N;c.N=null;a()}};return function(a){d.next={N:a};d=d.next;b.port2.postMessage(0)}}return"undefined"!==typeof document&&"onreadystatechange"in
document.createElement("SCRIPT")?function(a){var b=document.createElement("SCRIPT");b.onreadystatechange=function(){b.onreadystatechange=null;b.parentNode.removeChild(b);b=null;a();a=null};document.documentElement.appendChild(b)}:function(a){x.setTimeout(a,0)}};var K=function(){this.C=this.g=null},sa=new H(function(){return new L},function(a){a.reset()},100);K.prototype.add=function(a,b){var c=sa.get();c.set(a,b);this.C?this.C.next=c:(F(!this.g),this.g=c);this.C=c};K.prototype.remove=function(){var a=null;this.g&&(a=this.g,this.g=this.g.next,this.g||(this.C=null),a.next=null);return a};var L=function(){this.next=this.scope=this.H=null};L.prototype.set=function(a,b){this.H=a;this.scope=b;this.next=null};
L.prototype.reset=function(){this.next=this.scope=this.H=null};var O=function(a,b){M||ta();N||(M(),N=!0);ua.add(a,b)},M,ta=function(){var a=x.Promise;if(-1!=String(a).indexOf("[native code]")){var b=a.resolve(void 0);M=function(){b.then(va)}}else M=function(){var a=va,b;!(b=!A(x.setImmediate))&&(b=x.Window&&x.Window.prototype)&&(b=-1==I.indexOf("Edge")&&x.Window.prototype.setImmediate==x.setImmediate);b?(J||(J=ra()),J(a)):x.setImmediate(a)}},N=!1,ua=new K,va=function(){for(var a;a=ua.remove();){try{a.H.call(a.scope)}catch(b){qa(b)}sa.put(a)}N=!1};var Q=function(a,b){this.a=0;this.j=void 0;this.s=this.h=this.B=null;this.v=this.G=!1;if(a!=y)try{var c=this;a.call(b,function(a){P(c,2,a)},function(a){try{if(a instanceof Error)throw a;throw Error("Promise rejected.");}catch(e){}P(c,3,a)})}catch(d){P(this,3,d)}},wa=function(){this.next=this.context=this.i=this.f=this.child=null;this.D=!1};wa.prototype.reset=function(){this.context=this.i=this.f=this.child=null;this.D=!1};
var xa=new H(function(){return new wa},function(a){a.reset()},100),ya=function(a,b,c){var d=xa.get();d.f=a;d.i=b;d.context=c;return d},Aa=function(a,b,c){za(a,b,c,null)||O(ka(b,a))};Q.prototype.then=function(a,b,c){null!=a&&G(a,"opt_onFulfilled should be a function.");null!=b&&G(b,"opt_onRejected should be a function. Did you pass opt_context as the second argument instead of the third?");return Ba(this,A(a)?a:null,A(b)?b:null,c)};Q.prototype.then=Q.prototype.then;Q.prototype.$goog_Thenable=!0;
Q.prototype.na=function(a,b){return Ba(this,null,a,b)};var Da=function(a,b){a.h||2!=a.a&&3!=a.a||Ca(a);F(null!=b.f);a.s?a.s.next=b:a.h=b;a.s=b},Ba=function(a,b,c,d){var e=ya(null,null,null);e.child=new Q(function(a,g){e.f=b?function(c){try{var e=b.call(d,c);a(e)}catch(z){g(z)}}:a;e.i=c?function(b){try{var e=c.call(d,b);a(e)}catch(z){g(z)}}:g});e.child.B=a;Da(a,e);return e.child};Q.prototype.oa=function(a){F(1==this.a);this.a=0;P(this,2,a)};
Q.prototype.pa=function(a){F(1==this.a);this.a=0;P(this,3,a)};
var P=function(a,b,c){0==a.a&&(a===c&&(b=3,c=new TypeError("Promise cannot resolve to itself")),a.a=1,za(c,a.oa,a.pa,a)||(a.j=c,a.a=b,a.B=null,Ca(a),3!=b||Ea(a,c)))},za=function(a,b,c,d){if(a instanceof Q)return null!=b&&G(b,"opt_onFulfilled should be a function."),null!=c&&G(c,"opt_onRejected should be a function. Did you pass opt_context as the second argument instead of the third?"),Da(a,ya(b||y,c||null,d)),!0;var e;if(a)try{e=!!a.$goog_Thenable}catch(g){e=!1}else e=!1;if(e)return a.then(b,c,d),
!0;e=typeof a;if("object"==e&&null!=a||"function"==e)try{var f=a.then;if(A(f))return Ga(a,f,b,c,d),!0}catch(g){return c.call(d,g),!0}return!1},Ga=function(a,b,c,d,e){var f=!1,g=function(a){f||(f=!0,c.call(e,a))},k=function(a){f||(f=!0,d.call(e,a))};try{b.call(a,g,k)}catch(l){k(l)}},Ca=function(a){a.G||(a.G=!0,O(a.aa,a))},Ha=function(a){var b=null;a.h&&(b=a.h,a.h=b.next,b.next=null);a.h||(a.s=null);null!=b&&F(null!=b.f);return b};
Q.prototype.aa=function(){for(var a;a=Ha(this);){var b=this.a,c=this.j;if(3==b&&a.i&&!a.D){var d;for(d=this;d&&d.v;d=d.B)d.v=!1}if(a.child)a.child.B=null,Ia(a,b,c);else try{a.D?a.f.call(a.context):Ia(a,b,c)}catch(e){Ja.call(null,e)}xa.put(a)}this.G=!1};var Ia=function(a,b,c){2==b?a.f.call(a.context,c):a.i&&a.i.call(a.context,c)},Ea=function(a,b){a.v=!0;O(function(){a.v&&Ja.call(null,b)})},Ja=qa;function R(a,b){if(!(b instanceof Object))return b;switch(b.constructor){case Date:return new Date(b.getTime());case Object:void 0===a&&(a={});break;case Array:a=[];break;default:return b}for(var c in b)b.hasOwnProperty(c)&&(a[c]=R(a[c],b[c]));return a};Q.all=function(a){return new Q(function(b,c){var d=a.length,e=[];if(d)for(var f=function(a,c){d--;e[a]=c;0==d&&b(e)},g=function(a){c(a)},k=0,l;k<a.length;k++)l=a[k],Aa(l,ka(f,k),g);else b(e)})};Q.resolve=function(a){if(a instanceof Q)return a;var b=new Q(y);P(b,2,a);return b};Q.reject=function(a){return new Q(function(b,c){c(a)})};Q.prototype["catch"]=Q.prototype.na;var S=Q;"undefined"!==typeof Promise&&(S=Promise);var Ka=S;function La(a,b){a=new T(a,b);return a.subscribe.bind(a)}var T=function(a,b){var c=this;this.b=[];this.T=0;this.task=Ka.resolve();this.u=!1;this.J=b;this.task.then(function(){a(c)}).catch(function(a){c.error(a)})};T.prototype.next=function(a){U(this,function(b){b.next(a)})};T.prototype.error=function(a){U(this,function(b){b.error(a)});this.close(a)};T.prototype.complete=function(){U(this,function(a){a.complete()});this.close()};
T.prototype.subscribe=function(a,b,c){var d=this,e;if(void 0===a&&void 0===b&&void 0===c)throw Error("Missing Observer.");e=Ma(a)?a:{next:a,error:b,complete:c};void 0===e.next&&(e.next=Na);void 0===e.error&&(e.error=Na);void 0===e.complete&&(e.complete=Na);a=this.qa.bind(this,this.b.length);this.u&&this.task.then(function(){try{d.O?e.error(d.O):e.complete()}catch(f){}});this.b.push(e);return a};
T.prototype.qa=function(a){void 0!==this.b&&void 0!==this.b[a]&&(delete this.b[a],--this.T,0===this.T&&void 0!==this.J&&this.J(this))};var U=function(a,b){if(!a.u)for(var c=0;c<a.b.length;c++)Oa(a,c,b)},Oa=function(a,b,c){a.task.then(function(){if(void 0!==a.b&&void 0!==a.b[b])try{c(a.b[b])}catch(d){"undefined"!==typeof console&&console.error&&console.error(d)}})};T.prototype.close=function(a){var b=this;this.u||(this.u=!0,void 0!==a&&(this.O=a),this.task.then(function(){b.b=void 0;b.J=void 0}))};
function Ma(a){if("object"!==typeof a||null===a)return!1;for(var b=n(["next","error","complete"]),c=b.next();!c.done;c=b.next())if(c=c.value,c in a&&"function"===typeof a[c])return!0;return!1}function Na(){};var Pa=Error.captureStackTrace,V=function(a,b){this.code=a;this.message=b;if(Pa)Pa(this,Qa.prototype.create);else{var c=Error.apply(this,arguments);this.name="FirebaseError";Object.defineProperty(this,"stack",{get:function(){return c.stack}})}};V.prototype=Object.create(Error.prototype);V.prototype.constructor=V;V.prototype.name="FirebaseError";var Qa=function(a,b,c){this.ja=a;this.ka=b;this.Z=c;this.pattern=/\{\$([^}]+)}/g};
Qa.prototype.create=function(a,b){void 0===b&&(b={});var c=this.Z[a];a=this.ja+"/"+a;var c=void 0===c?"Error":c.replace(this.pattern,function(a,c){a=b[c];return void 0!==a?a.toString():"<"+c+"?>"}),c=this.ka+": "+c+" ("+a+").",c=new V(a,c),d;for(d in b)b.hasOwnProperty(d)&&"_"!==d.slice(-1)&&(c[d]=b[d]);return c};var W=S,X=function(a,b,c){var d=this;this.P=c;this.S=!1;this.l={};this.I=b;this.fa=R(void 0,a);Object.keys(c.INTERNAL.factories).forEach(function(a){var b=c.INTERNAL.useAsService(d,a);null!==b&&(b=d.da.bind(d,b),d[a]=b)})};X.prototype.delete=function(){var a=this;return(new W(function(b){Y(a);b()})).then(function(){a.P.INTERNAL.removeApp(a.I);return W.all(Object.keys(a.l).map(function(b){return a.l[b].INTERNAL.delete()}))}).then(function(){a.S=!0;a.l={}})};
X.prototype.da=function(a){Y(this);void 0===this.l[a]&&(this.l[a]=this.P.INTERNAL.factories[a](this,this.ca.bind(this)));return this.l[a]};X.prototype.ca=function(a){R(this,a)};var Y=function(a){a.S&&Z(Ra("deleted",{name:a.I}))};h.Object.defineProperties(X.prototype,{name:{configurable:!0,enumerable:!0,get:function(){Y(this);return this.I}},options:{configurable:!0,enumerable:!0,get:function(){Y(this);return this.fa}}});X.prototype.name&&X.prototype.options||X.prototype.delete||console.log("dc");
function Sa(){function a(a){a=a||"[DEFAULT]";var b=d[a];void 0===b&&Z("noApp",{name:a});return b}function b(a,b){Object.keys(e).forEach(function(d){d=c(a,d);if(null!==d&&f[d])f[d](b,a)})}function c(a,b){if("serverAuth"===b)return null;var c=b;a=a.options;"auth"===b&&(a.serviceAccount||a.credential)&&(c="serverAuth","serverAuth"in e||Z("serverAuthMissing"));return c}var d={},e={},f={},g={__esModule:!0,initializeApp:function(a,c){void 0===c?c="[DEFAULT]":"string"===typeof c&&""!==c||Z("bad-app-name",
{name:c+""});void 0!==d[c]&&Z("dupApp",{name:c});a=new X(a,c,g);d[c]=a;b(a,"create");void 0!=a.INTERNAL&&void 0!=a.INTERNAL.getToken||R(a,{INTERNAL:{getToken:function(){return W.resolve(null)},addAuthTokenListener:function(){},removeAuthTokenListener:function(){}}});return a},app:a,apps:null,Promise:W,SDK_VERSION:"0.0.0",INTERNAL:{registerService:function(b,c,d,v){e[b]&&Z("dupService",{name:b});e[b]=c;v&&(f[b]=v);c=function(c){void 0===c&&(c=a());return c[b]()};void 0!==d&&R(c,d);return g[b]=c},createFirebaseNamespace:Sa,
extendNamespace:function(a){R(g,a)},createSubscribe:La,ErrorFactory:Qa,removeApp:function(a){b(d[a],"delete");delete d[a]},factories:e,useAsService:c,Promise:Q,deepExtend:R}};g["default"]=g;Object.defineProperty(g,"apps",{get:function(){return Object.keys(d).map(function(a){return d[a]})}});a.App=X;return g}function Z(a,b){throw Error(Ra(a,b));}
function Ra(a,b){b=b||{};b={noApp:"No Firebase App '"+b.name+"' has been created - call Firebase App.initializeApp().","bad-app-name":"Illegal App name: '"+b.name+"'.",dupApp:"Firebase App named '"+b.name+"' already exists.",deleted:"Firebase App named '"+b.name+"' already deleted.",dupService:"Firebase Service named '"+b.name+"' already registered.",serverAuthMissing:"Initializing the Firebase SDK with a service account is only allowed in a Node.js environment. On client devices, you should instead initialize the SDK with an api key and auth domain."}[a];
return void 0===b?"Application Error: ("+a+")":b};"undefined"!==typeof firebase&&(firebase=Sa()); })();
firebase.SDK_VERSION = "3.5.2";
module.exports = firebase;

},{}],5:[function(require,module,exports){
var firebase = require('./app');
/*! @license Firebase v3.5.2
    Build: 3.5.2-rc.1
    Terms: https://developers.google.com/terms */
(function(){var h,aa=aa||{},l=this,ba=function(){},ca=function(){throw Error("unimplemented abstract method");},m=function(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=
typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";else if("function"==b&&"undefined"==typeof a.call)return"object";return b},da=function(a){return null===a},ea=function(a){return"array"==m(a)},fa=function(a){var b=m(a);return"array"==b||"object"==b&&"number"==typeof a.length},n=function(a){return"string"==typeof a},ga=function(a){return"number"==typeof a},p=function(a){return"function"==m(a)},ha=function(a){var b=typeof a;
return"object"==b&&null!=a||"function"==b},ia=function(a,b,c){return a.call.apply(a.bind,arguments)},ja=function(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}},q=function(a,b,c){q=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?ia:ja;return q.apply(null,
arguments)},ka=function(a,b){var c=Array.prototype.slice.call(arguments,1);return function(){var b=c.slice();b.push.apply(b,arguments);return a.apply(this,b)}},la=Date.now||function(){return+new Date},r=function(a,b){function c(){}c.prototype=b.prototype;a.Vc=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.gf=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};var u=function(a){if(Error.captureStackTrace)Error.captureStackTrace(this,u);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))};r(u,Error);u.prototype.name="CustomError";var ma=function(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")},na=String.prototype.trim?function(a){return a.trim()}:function(a){return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")},oa=/&/g,pa=/</g,qa=/>/g,ra=/"/g,sa=/'/g,ta=/\x00/g,va=/[\x00&<>"']/,v=function(a,b){return-1!=a.indexOf(b)},wa=function(a,b){return a<b?-1:a>b?1:0};var xa=function(a,b){b.unshift(a);u.call(this,ma.apply(null,b));b.shift()};r(xa,u);xa.prototype.name="AssertionError";
var ya=function(a,b,c,d){var e="Assertion failed";if(c)var e=e+(": "+c),f=d;else a&&(e+=": "+a,f=b);throw new xa(""+e,f||[]);},w=function(a,b,c){a||ya("",null,b,Array.prototype.slice.call(arguments,2))},za=function(a,b){throw new xa("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));},Aa=function(a,b,c){ga(a)||ya("Expected number but got %s: %s.",[m(a),a],b,Array.prototype.slice.call(arguments,2));return a},Ba=function(a,b,c){n(a)||ya("Expected string but got %s: %s.",[m(a),a],b,Array.prototype.slice.call(arguments,
2))},Ca=function(a,b,c){p(a)||ya("Expected function but got %s: %s.",[m(a),a],b,Array.prototype.slice.call(arguments,2))};var Da=Array.prototype.indexOf?function(a,b,c){w(null!=a.length);return Array.prototype.indexOf.call(a,b,c)}:function(a,b,c){c=null==c?0:0>c?Math.max(0,a.length+c):c;if(n(a))return n(b)&&1==b.length?a.indexOf(b,c):-1;for(;c<a.length;c++)if(c in a&&a[c]===b)return c;return-1},Ea=Array.prototype.forEach?function(a,b,c){w(null!=a.length);Array.prototype.forEach.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=n(a)?a.split(""):a,f=0;f<d;f++)f in e&&b.call(c,e[f],f,a)},Fa=function(a,b){for(var c=n(a)?
a.split(""):a,d=a.length-1;0<=d;--d)d in c&&b.call(void 0,c[d],d,a)},Ga=Array.prototype.map?function(a,b,c){w(null!=a.length);return Array.prototype.map.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=Array(d),f=n(a)?a.split(""):a,g=0;g<d;g++)g in f&&(e[g]=b.call(c,f[g],g,a));return e},Ha=Array.prototype.some?function(a,b,c){w(null!=a.length);return Array.prototype.some.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=n(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&b.call(c,e[f],f,a))return!0;return!1},
Ja=function(a){var b;a:{b=Ia;for(var c=a.length,d=n(a)?a.split(""):a,e=0;e<c;e++)if(e in d&&b.call(void 0,d[e],e,a)){b=e;break a}b=-1}return 0>b?null:n(a)?a.charAt(b):a[b]},Ka=function(a,b){return 0<=Da(a,b)},Ma=function(a,b){b=Da(a,b);var c;(c=0<=b)&&La(a,b);return c},La=function(a,b){w(null!=a.length);return 1==Array.prototype.splice.call(a,b,1).length},Na=function(a,b){var c=0;Fa(a,function(d,e){b.call(void 0,d,e,a)&&La(a,e)&&c++})},Oa=function(a){return Array.prototype.concat.apply(Array.prototype,
arguments)},Pa=function(a){return Array.prototype.concat.apply(Array.prototype,arguments)},Qa=function(a){var b=a.length;if(0<b){for(var c=Array(b),d=0;d<b;d++)c[d]=a[d];return c}return[]},Ra=function(a,b){for(var c=1;c<arguments.length;c++){var d=arguments[c];if(fa(d)){var e=a.length||0,f=d.length||0;a.length=e+f;for(var g=0;g<f;g++)a[e+g]=d[g]}else a.push(d)}};var Sa=function(a,b){for(var c in a)b.call(void 0,a[c],c,a)},Ta=function(a){var b=[],c=0,d;for(d in a)b[c++]=a[d];return b},Ua=function(a){var b=[],c=0,d;for(d in a)b[c++]=d;return b},Va=function(a){for(var b in a)return!1;return!0},Wa=function(a,b){for(var c in a)if(!(c in b)||a[c]!==b[c])return!1;for(c in b)if(!(c in a))return!1;return!0},Xa=function(a){var b={},c;for(c in a)b[c]=a[c];return b},Ya="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "),
Za=function(a,b){for(var c,d,e=1;e<arguments.length;e++){d=arguments[e];for(c in d)a[c]=d[c];for(var f=0;f<Ya.length;f++)c=Ya[f],Object.prototype.hasOwnProperty.call(d,c)&&(a[c]=d[c])}};var $a;a:{var ab=l.navigator;if(ab){var bb=ab.userAgent;if(bb){$a=bb;break a}}$a=""}var x=function(a){return v($a,a)};var cb=function(a){cb[" "](a);return a};cb[" "]=ba;var eb=function(a,b){var c=db;return Object.prototype.hasOwnProperty.call(c,a)?c[a]:c[a]=b(a)};var fb=x("Opera"),y=x("Trident")||x("MSIE"),gb=x("Edge"),hb=gb||y,ib=x("Gecko")&&!(v($a.toLowerCase(),"webkit")&&!x("Edge"))&&!(x("Trident")||x("MSIE"))&&!x("Edge"),jb=v($a.toLowerCase(),"webkit")&&!x("Edge"),kb=function(){var a=l.document;return a?a.documentMode:void 0},lb;
a:{var mb="",nb=function(){var a=$a;if(ib)return/rv\:([^\);]+)(\)|;)/.exec(a);if(gb)return/Edge\/([\d\.]+)/.exec(a);if(y)return/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);if(jb)return/WebKit\/(\S+)/.exec(a);if(fb)return/(?:Version)[ \/]?(\S+)/.exec(a)}();nb&&(mb=nb?nb[1]:"");if(y){var ob=kb();if(null!=ob&&ob>parseFloat(mb)){lb=String(ob);break a}}lb=mb}
var pb=lb,db={},z=function(a){return eb(a,function(){for(var b=0,c=na(String(pb)).split("."),d=na(String(a)).split("."),e=Math.max(c.length,d.length),f=0;0==b&&f<e;f++){var g=c[f]||"",k=d[f]||"";do{g=/(\d*)(\D*)(.*)/.exec(g)||["","","",""];k=/(\d*)(\D*)(.*)/.exec(k)||["","","",""];if(0==g[0].length&&0==k[0].length)break;b=wa(0==g[1].length?0:parseInt(g[1],10),0==k[1].length?0:parseInt(k[1],10))||wa(0==g[2].length,0==k[2].length)||wa(g[2],k[2]);g=g[3];k=k[3]}while(0==b)}return 0<=b})},qb;var rb=l.document;
qb=rb&&y?kb()||("CSS1Compat"==rb.compatMode?parseInt(pb,10):5):void 0;var sb=null,tb=null,vb=function(a){var b="";ub(a,function(a){b+=String.fromCharCode(a)});return b},ub=function(a,b){function c(b){for(;d<a.length;){var c=a.charAt(d++),e=tb[c];if(null!=e)return e;if(!/^[\s\xa0]*$/.test(c))throw Error("Unknown base64 encoding at char: "+c);}return b}wb();for(var d=0;;){var e=c(-1),f=c(0),g=c(64),k=c(64);if(64===k&&-1===e)break;b(e<<2|f>>4);64!=g&&(b(f<<4&240|g>>2),64!=k&&b(g<<6&192|k))}},wb=function(){if(!sb){sb={};tb={};for(var a=0;65>a;a++)sb[a]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(a),
tb[sb[a]]=a,62<=a&&(tb["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(a)]=a)}};var xb=!y||9<=Number(qb),yb=y&&!z("9");!jb||z("528");ib&&z("1.9b")||y&&z("8")||fb&&z("9.5")||jb&&z("528");ib&&!z("8")||y&&z("9");var zb=function(){this.Ba=this.Ba;this.Wb=this.Wb};zb.prototype.Ba=!1;zb.prototype.isDisposed=function(){return this.Ba};zb.prototype.Ra=function(){if(this.Wb)for(;this.Wb.length;)this.Wb.shift()()};var Ab=function(a,b){this.type=a;this.currentTarget=this.target=b;this.defaultPrevented=this.Ya=!1;this.Bd=!0};Ab.prototype.preventDefault=function(){this.defaultPrevented=!0;this.Bd=!1};var Bb=function(a,b){Ab.call(this,a?a.type:"");this.relatedTarget=this.currentTarget=this.target=null;this.charCode=this.keyCode=this.button=this.screenY=this.screenX=this.clientY=this.clientX=this.offsetY=this.offsetX=0;this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1;this.ob=this.state=null;a&&this.init(a,b)};r(Bb,Ab);
Bb.prototype.init=function(a,b){var c=this.type=a.type,d=a.changedTouches?a.changedTouches[0]:null;this.target=a.target||a.srcElement;this.currentTarget=b;if(b=a.relatedTarget){if(ib){var e;a:{try{cb(b.nodeName);e=!0;break a}catch(f){}e=!1}e||(b=null)}}else"mouseover"==c?b=a.fromElement:"mouseout"==c&&(b=a.toElement);this.relatedTarget=b;null===d?(this.offsetX=jb||void 0!==a.offsetX?a.offsetX:a.layerX,this.offsetY=jb||void 0!==a.offsetY?a.offsetY:a.layerY,this.clientX=void 0!==a.clientX?a.clientX:
a.pageX,this.clientY=void 0!==a.clientY?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0):(this.clientX=void 0!==d.clientX?d.clientX:d.pageX,this.clientY=void 0!==d.clientY?d.clientY:d.pageY,this.screenX=d.screenX||0,this.screenY=d.screenY||0);this.button=a.button;this.keyCode=a.keyCode||0;this.charCode=a.charCode||("keypress"==c?a.keyCode:0);this.ctrlKey=a.ctrlKey;this.altKey=a.altKey;this.shiftKey=a.shiftKey;this.metaKey=a.metaKey;this.state=a.state;this.ob=a;a.defaultPrevented&&
this.preventDefault()};Bb.prototype.preventDefault=function(){Bb.Vc.preventDefault.call(this);var a=this.ob;if(a.preventDefault)a.preventDefault();else if(a.returnValue=!1,yb)try{if(a.ctrlKey||112<=a.keyCode&&123>=a.keyCode)a.keyCode=-1}catch(b){}};Bb.prototype.le=function(){return this.ob};var Cb="closure_listenable_"+(1E6*Math.random()|0),Db=0;var Eb=function(a,b,c,d,e){this.listener=a;this.ac=null;this.src=b;this.type=c;this.Gb=!!d;this.Nb=e;this.key=++Db;this.cb=this.Fb=!1},Fb=function(a){a.cb=!0;a.listener=null;a.ac=null;a.src=null;a.Nb=null};var Gb=function(a){this.src=a;this.A={};this.Cb=0};Gb.prototype.add=function(a,b,c,d,e){var f=a.toString();a=this.A[f];a||(a=this.A[f]=[],this.Cb++);var g=Hb(a,b,d,e);-1<g?(b=a[g],c||(b.Fb=!1)):(b=new Eb(b,this.src,f,!!d,e),b.Fb=c,a.push(b));return b};Gb.prototype.remove=function(a,b,c,d){a=a.toString();if(!(a in this.A))return!1;var e=this.A[a];b=Hb(e,b,c,d);return-1<b?(Fb(e[b]),La(e,b),0==e.length&&(delete this.A[a],this.Cb--),!0):!1};
var Ib=function(a,b){var c=b.type;c in a.A&&Ma(a.A[c],b)&&(Fb(b),0==a.A[c].length&&(delete a.A[c],a.Cb--))};Gb.prototype.Ac=function(a,b,c,d){a=this.A[a.toString()];var e=-1;a&&(e=Hb(a,b,c,d));return-1<e?a[e]:null};var Hb=function(a,b,c,d){for(var e=0;e<a.length;++e){var f=a[e];if(!f.cb&&f.listener==b&&f.Gb==!!c&&f.Nb==d)return e}return-1};var Jb="closure_lm_"+(1E6*Math.random()|0),Kb={},Lb=0,Mb=function(a,b,c,d,e){if(ea(b))for(var f=0;f<b.length;f++)Mb(a,b[f],c,d,e);else c=Nb(c),a&&a[Cb]?a.listen(b,c,d,e):Ob(a,b,c,!1,d,e)},Ob=function(a,b,c,d,e,f){if(!b)throw Error("Invalid event type");var g=!!e,k=Pb(a);k||(a[Jb]=k=new Gb(a));c=k.add(b,c,d,e,f);if(!c.ac){d=Qb();c.ac=d;d.src=a;d.listener=c;if(a.addEventListener)a.addEventListener(b.toString(),d,g);else if(a.attachEvent)a.attachEvent(Rb(b.toString()),d);else throw Error("addEventListener and attachEvent are unavailable.");
Lb++}},Qb=function(){var a=Sb,b=xb?function(c){return a.call(b.src,b.listener,c)}:function(c){c=a.call(b.src,b.listener,c);if(!c)return c};return b},Tb=function(a,b,c,d,e){if(ea(b))for(var f=0;f<b.length;f++)Tb(a,b[f],c,d,e);else c=Nb(c),a&&a[Cb]?Ub(a,b,c,d,e):Ob(a,b,c,!0,d,e)},Vb=function(a,b,c,d,e){if(ea(b))for(var f=0;f<b.length;f++)Vb(a,b[f],c,d,e);else c=Nb(c),a&&a[Cb]?a.ba.remove(String(b),c,d,e):a&&(a=Pb(a))&&(b=a.Ac(b,c,!!d,e))&&Wb(b)},Wb=function(a){if(!ga(a)&&a&&!a.cb){var b=a.src;if(b&&
b[Cb])Ib(b.ba,a);else{var c=a.type,d=a.ac;b.removeEventListener?b.removeEventListener(c,d,a.Gb):b.detachEvent&&b.detachEvent(Rb(c),d);Lb--;(c=Pb(b))?(Ib(c,a),0==c.Cb&&(c.src=null,b[Jb]=null)):Fb(a)}}},Rb=function(a){return a in Kb?Kb[a]:Kb[a]="on"+a},Yb=function(a,b,c,d){var e=!0;if(a=Pb(a))if(b=a.A[b.toString()])for(b=b.concat(),a=0;a<b.length;a++){var f=b[a];f&&f.Gb==c&&!f.cb&&(f=Xb(f,d),e=e&&!1!==f)}return e},Xb=function(a,b){var c=a.listener,d=a.Nb||a.src;a.Fb&&Wb(a);return c.call(d,b)},Sb=function(a,
b){if(a.cb)return!0;if(!xb){if(!b)a:{b=["window","event"];for(var c=l,d;d=b.shift();)if(null!=c[d])c=c[d];else{b=null;break a}b=c}d=b;b=new Bb(d,this);c=!0;if(!(0>d.keyCode||void 0!=d.returnValue)){a:{var e=!1;if(0==d.keyCode)try{d.keyCode=-1;break a}catch(g){e=!0}if(e||void 0==d.returnValue)d.returnValue=!0}d=[];for(e=b.currentTarget;e;e=e.parentNode)d.push(e);a=a.type;for(e=d.length-1;!b.Ya&&0<=e;e--){b.currentTarget=d[e];var f=Yb(d[e],a,!0,b),c=c&&f}for(e=0;!b.Ya&&e<d.length;e++)b.currentTarget=
d[e],f=Yb(d[e],a,!1,b),c=c&&f}return c}return Xb(a,new Bb(b,this))},Pb=function(a){a=a[Jb];return a instanceof Gb?a:null},Zb="__closure_events_fn_"+(1E9*Math.random()>>>0),Nb=function(a){w(a,"Listener can not be null.");if(p(a))return a;w(a.handleEvent,"An object listener must have handleEvent method.");a[Zb]||(a[Zb]=function(b){return a.handleEvent(b)});return a[Zb]};var $b=/^[+a-zA-Z0-9_.!#$%&'*\/=?^`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,63}$/;var bc=function(){this.kc="";this.Td=ac};bc.prototype.Qb=!0;bc.prototype.Lb=function(){return this.kc};bc.prototype.toString=function(){return"Const{"+this.kc+"}"};var cc=function(a){if(a instanceof bc&&a.constructor===bc&&a.Td===ac)return a.kc;za("expected object of type Const, got '"+a+"'");return"type_error:Const"},ac={},dc=function(a){var b=new bc;b.kc=a;return b};dc("");var fc=function(){this.la="";this.Sd=ec};fc.prototype.Qb=!0;fc.prototype.Lb=function(){return this.la};fc.prototype.toString=function(){return"SafeUrl{"+this.la+"}"};
var gc=function(a){if(a instanceof fc&&a.constructor===fc&&a.Sd===ec)return a.la;za("expected object of type SafeUrl, got '"+a+"' of type "+m(a));return"type_error:SafeUrl"},hc=/^(?:(?:https?|mailto|ftp):|[^&:/?#]*(?:[/?#]|$))/i,jc=function(a){if(a instanceof fc)return a;a=a.Qb?a.Lb():String(a);hc.test(a)||(a="about:invalid#zClosurez");return ic(a)},ec={},ic=function(a){var b=new fc;b.la=a;return b};ic("about:blank");var kc=function(a){return/^\s*$/.test(a)?!1:/^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g,"@").replace(/(?:"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)[\s\u2028\u2029]*(?=:|,|]|}|$)/g,"]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g,""))},lc=function(a){a=String(a);if(kc(a))try{return eval("("+a+")")}catch(b){}throw Error("Invalid JSON string: "+a);},oc=function(a){var b=[];mc(new nc,a,b);return b.join("")},nc=function(){this.ec=void 0},
mc=function(a,b,c){if(null==b)c.push("null");else{if("object"==typeof b){if(ea(b)){var d=b;b=d.length;c.push("[");for(var e="",f=0;f<b;f++)c.push(e),e=d[f],mc(a,a.ec?a.ec.call(d,String(f),e):e,c),e=",";c.push("]");return}if(b instanceof String||b instanceof Number||b instanceof Boolean)b=b.valueOf();else{c.push("{");f="";for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(e=b[d],"function"!=typeof e&&(c.push(f),pc(d,c),c.push(":"),mc(a,a.ec?a.ec.call(b,d,e):e,c),f=","));c.push("}");return}}switch(typeof b){case "string":pc(b,
c);break;case "number":c.push(isFinite(b)&&!isNaN(b)?String(b):"null");break;case "boolean":c.push(String(b));break;case "function":c.push("null");break;default:throw Error("Unknown type: "+typeof b);}}},qc={'"':'\\"',"\\":"\\\\","/":"\\/","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\x0B":"\\u000b"},rc=/\uffff/.test("\uffff")?/[\\\"\x00-\x1f\x7f-\uffff]/g:/[\\\"\x00-\x1f\x7f-\xff]/g,pc=function(a,b){b.push('"',a.replace(rc,function(a){var b=qc[a];b||(b="\\u"+(a.charCodeAt(0)|65536).toString(16).substr(1),
qc[a]=b);return b}),'"')};var sc=function(){};sc.prototype.Zc=null;sc.prototype.nb=ca;var tc=function(a){return a.Zc||(a.Zc=a.Tb())};sc.prototype.Tb=ca;var uc,vc=function(){};r(vc,sc);vc.prototype.nb=function(){var a=wc(this);return a?new ActiveXObject(a):new XMLHttpRequest};vc.prototype.Tb=function(){var a={};wc(this)&&(a[0]=!0,a[1]=!0);return a};
var wc=function(a){if(!a.od&&"undefined"==typeof XMLHttpRequest&&"undefined"!=typeof ActiveXObject){for(var b=["MSXML2.XMLHTTP.6.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"],c=0;c<b.length;c++){var d=b[c];try{return new ActiveXObject(d),a.od=d}catch(e){}}throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed");}return a.od};uc=new vc;var xc=function(){};r(xc,sc);xc.prototype.nb=function(){var a=new XMLHttpRequest;if("withCredentials"in a)return a;if("undefined"!=typeof XDomainRequest)return new yc;throw Error("Unsupported browser");};xc.prototype.Tb=function(){return{}};
var yc=function(){this.qa=new XDomainRequest;this.readyState=0;this.onreadystatechange=null;this.responseText="";this.status=-1;this.statusText=this.responseXML=null;this.qa.onload=q(this.pe,this);this.qa.onerror=q(this.md,this);this.qa.onprogress=q(this.qe,this);this.qa.ontimeout=q(this.re,this)};h=yc.prototype;h.open=function(a,b,c){if(null!=c&&!c)throw Error("Only async requests are supported.");this.qa.open(a,b)};
h.send=function(a){if(a)if("string"==typeof a)this.qa.send(a);else throw Error("Only string data is supported");else this.qa.send()};h.abort=function(){this.qa.abort()};h.setRequestHeader=function(){};h.pe=function(){this.status=200;this.responseText=this.qa.responseText;zc(this,4)};h.md=function(){this.status=500;this.responseText="";zc(this,4)};h.re=function(){this.md()};h.qe=function(){this.status=200;zc(this,1)};var zc=function(a,b){a.readyState=b;if(a.onreadystatechange)a.onreadystatechange()};var A=function(a,b){this.h=[];this.g=b;for(var c=!0,d=a.length-1;0<=d;d--){var e=a[d]|0;c&&e==b||(this.h[d]=e,c=!1)}},Ac={},Bc=function(a){if(-128<=a&&128>a){var b=Ac[a];if(b)return b}b=new A([a|0],0>a?-1:0);-128<=a&&128>a&&(Ac[a]=b);return b},D=function(a){if(isNaN(a)||!isFinite(a))return B;if(0>a)return C(D(-a));for(var b=[],c=1,d=0;a>=c;d++)b[d]=a/c|0,c*=4294967296;return new A(b,0)},Cc=function(a,b){if(0==a.length)throw Error("number format error: empty string");b=b||10;if(2>b||36<b)throw Error("radix out of range: "+
b);if("-"==a.charAt(0))return C(Cc(a.substring(1),b));if(0<=a.indexOf("-"))throw Error('number format error: interior "-" character');for(var c=D(Math.pow(b,8)),d=B,e=0;e<a.length;e+=8){var f=Math.min(8,a.length-e),g=parseInt(a.substring(e,e+f),b);8>f?(f=D(Math.pow(b,f)),d=d.multiply(f).add(D(g))):(d=d.multiply(c),d=d.add(D(g)))}return d},B=Bc(0),Dc=Bc(1),Ec=Bc(16777216),Fc=function(a){if(-1==a.g)return-Fc(C(a));for(var b=0,c=1,d=0;d<a.h.length;d++)b+=Gc(a,d)*c,c*=4294967296;return b};
A.prototype.toString=function(a){a=a||10;if(2>a||36<a)throw Error("radix out of range: "+a);if(Hc(this))return"0";if(-1==this.g)return"-"+C(this).toString(a);for(var b=D(Math.pow(a,6)),c=this,d="";;){var e=Ic(c,b),c=Jc(c,e.multiply(b)),f=((0<c.h.length?c.h[0]:c.g)>>>0).toString(a),c=e;if(Hc(c))return f+d;for(;6>f.length;)f="0"+f;d=""+f+d}};
var E=function(a,b){return 0>b?0:b<a.h.length?a.h[b]:a.g},Gc=function(a,b){a=E(a,b);return 0<=a?a:4294967296+a},Hc=function(a){if(0!=a.g)return!1;for(var b=0;b<a.h.length;b++)if(0!=a.h[b])return!1;return!0};A.prototype.Ib=function(a){if(this.g!=a.g)return!1;for(var b=Math.max(this.h.length,a.h.length),c=0;c<b;c++)if(E(this,c)!=E(a,c))return!1;return!0};A.prototype.compare=function(a){a=Jc(this,a);return-1==a.g?-1:Hc(a)?0:1};
var C=function(a){for(var b=a.h.length,c=[],d=0;d<b;d++)c[d]=~a.h[d];return(new A(c,~a.g)).add(Dc)};A.prototype.add=function(a){for(var b=Math.max(this.h.length,a.h.length),c=[],d=0,e=0;e<=b;e++){var f=d+(E(this,e)&65535)+(E(a,e)&65535),g=(f>>>16)+(E(this,e)>>>16)+(E(a,e)>>>16),d=g>>>16,f=f&65535,g=g&65535;c[e]=g<<16|f}return new A(c,c[c.length-1]&-2147483648?-1:0)};var Jc=function(a,b){return a.add(C(b))};
A.prototype.multiply=function(a){if(Hc(this)||Hc(a))return B;if(-1==this.g)return-1==a.g?C(this).multiply(C(a)):C(C(this).multiply(a));if(-1==a.g)return C(this.multiply(C(a)));if(0>this.compare(Ec)&&0>a.compare(Ec))return D(Fc(this)*Fc(a));for(var b=this.h.length+a.h.length,c=[],d=0;d<2*b;d++)c[d]=0;for(d=0;d<this.h.length;d++)for(var e=0;e<a.h.length;e++){var f=E(this,d)>>>16,g=E(this,d)&65535,k=E(a,e)>>>16,t=E(a,e)&65535;c[2*d+2*e]+=g*t;Kc(c,2*d+2*e);c[2*d+2*e+1]+=f*t;Kc(c,2*d+2*e+1);c[2*d+2*e+
1]+=g*k;Kc(c,2*d+2*e+1);c[2*d+2*e+2]+=f*k;Kc(c,2*d+2*e+2)}for(d=0;d<b;d++)c[d]=c[2*d+1]<<16|c[2*d];for(d=b;d<2*b;d++)c[d]=0;return new A(c,0)};
var Kc=function(a,b){for(;(a[b]&65535)!=a[b];)a[b+1]+=a[b]>>>16,a[b]&=65535,b++},Ic=function(a,b){if(Hc(b))throw Error("division by zero");if(Hc(a))return B;if(-1==a.g)return-1==b.g?Ic(C(a),C(b)):C(Ic(C(a),b));if(-1==b.g)return C(Ic(a,C(b)));if(30<a.h.length){if(-1==a.g||-1==b.g)throw Error("slowDivide_ only works with positive integers.");for(var c=Dc;0>=b.compare(a);)c=c.shiftLeft(1),b=b.shiftLeft(1);var d=Lc(c,1),e=Lc(b,1),f;b=Lc(b,2);for(c=Lc(c,2);!Hc(b);)f=e.add(b),0>=f.compare(a)&&(d=d.add(c),
e=f),b=Lc(b,1),c=Lc(c,1);return d}for(c=B;0<=a.compare(b);){d=Math.max(1,Math.floor(Fc(a)/Fc(b)));e=Math.ceil(Math.log(d)/Math.LN2);e=48>=e?1:Math.pow(2,e-48);f=D(d);for(var g=f.multiply(b);-1==g.g||0<g.compare(a);)d-=e,f=D(d),g=f.multiply(b);Hc(f)&&(f=Dc);c=c.add(f);a=Jc(a,g)}return c},Mc=function(a,b){for(var c=Math.max(a.h.length,b.h.length),d=[],e=0;e<c;e++)d[e]=E(a,e)|E(b,e);return new A(d,a.g|b.g)};
A.prototype.shiftLeft=function(a){var b=a>>5;a%=32;for(var c=this.h.length+b+(0<a?1:0),d=[],e=0;e<c;e++)d[e]=0<a?E(this,e-b)<<a|E(this,e-b-1)>>>32-a:E(this,e-b);return new A(d,this.g)};var Lc=function(a,b){var c=b>>5;b%=32;for(var d=a.h.length-c,e=[],f=0;f<d;f++)e[f]=0<b?E(a,f+c)>>>b|E(a,f+c+1)<<32-b:E(a,f+c);return new A(e,a.g)};var Nc=function(a,b){this.sb=a;this.pa=b};Nc.prototype.Ib=function(a){return this.pa==a.pa&&this.sb.Ib(Xa(a.sb))};Nc.prototype.toString=ca;
var Qc=function(a){try{var b;if(b=0==a.lastIndexOf("[",0)){var c=a.length-1;b=0<=c&&a.indexOf("]",c)==c}return b?new Oc(a.substring(1,a.length-1)):new Pc(a)}catch(d){return null}},Pc=function(a){var b=B;if(a instanceof A){if(0!=a.g||0>a.compare(B)||0<a.compare(Rc))throw Error("The address does not look like an IPv4.");b=Xa(a)}else{if(!Sc.test(a))throw Error(a+" does not look like an IPv4 address.");var c=a.split(".");if(4!=c.length)throw Error(a+" does not look like an IPv4 address.");for(var d=0;d<
c.length;d++){var e;e=c[d];var f=Number(e);e=0==f&&/^[\s\xa0]*$/.test(e)?NaN:f;if(isNaN(e)||0>e||255<e||1!=c[d].length&&0==c[d].lastIndexOf("0",0))throw Error("In "+a+", octet "+d+" is not valid");e=D(e);b=Mc(b.shiftLeft(8),e)}}Nc.call(this,b,4)};r(Pc,Nc);var Sc=/^[0-9.]*$/,Rc=Jc(Dc.shiftLeft(32),Dc);Pc.prototype.toString=function(){if(this.Ea)return this.Ea;for(var a=Gc(this.sb,0),b=[],c=3;0<=c;c--)b[c]=String(a&255),a>>>=8;return this.Ea=b.join(".")};
var Oc=function(a){var b=B;if(a instanceof A){if(0!=a.g||0>a.compare(B)||0<a.compare(Tc))throw Error("The address does not look like a valid IPv6.");b=Xa(a)}else{if(!Uc.test(a))throw Error(a+" is not a valid IPv6 address.");var c=a.split(":");if(-1!=c[c.length-1].indexOf(".")){a=Gc(Xa((new Pc(c[c.length-1])).sb),0);var d=[];d.push((a>>>16&65535).toString(16));d.push((a&65535).toString(16));La(c,c.length-1);Ra(c,d);a=c.join(":")}d=a.split("::");if(2<d.length||1==d.length&&8!=c.length)throw Error(a+
" is not a valid IPv6 address.");if(1<d.length){c=d[0].split(":");d=d[1].split(":");1==c.length&&""==c[0]&&(c=[]);1==d.length&&""==d[0]&&(d=[]);var e=8-(c.length+d.length);if(1>e)c=[];else{for(var f=[],g=0;g<e;g++)f[g]="0";c=Pa(c,f,d)}}if(8!=c.length)throw Error(a+" is not a valid IPv6 address");for(d=0;d<c.length;d++){e=Cc(c[d],16);if(0>e.compare(B)||0<e.compare(Vc))throw Error(c[d]+" in "+a+" is not a valid hextet.");b=Mc(b.shiftLeft(16),e)}}Nc.call(this,b,6)};r(Oc,Nc);
var Uc=/^([a-fA-F0-9]*:){2}[a-fA-F0-9:.]*$/,Vc=Bc(65535),Tc=Jc(Dc.shiftLeft(128),Dc);Oc.prototype.toString=function(){if(this.Ea)return this.Ea;for(var a=[],b=3;0<=b;b--){var c=Gc(this.sb,b),d=c&65535;a.push((c>>>16).toString(16));a.push(d.toString(16))}for(var c=b=-1,e=d=0,f=0;f<a.length;f++)"0"==a[f]?(e++,-1==c&&(c=f),e>d&&(d=e,b=c)):(c=-1,e=0);0<d&&(b+d==a.length&&a.push(""),a.splice(b,d,""),0==b&&(a=[""].concat(a)));return this.Ea=a.join(":")};var Xc=function(){this.Zb="";this.Ud=Wc};Xc.prototype.Qb=!0;Xc.prototype.Lb=function(){return this.Zb};Xc.prototype.toString=function(){return"TrustedResourceUrl{"+this.Zb+"}"};var Wc={};var Zc=function(){this.la="";this.Rd=Yc};Zc.prototype.Qb=!0;Zc.prototype.Lb=function(){return this.la};Zc.prototype.toString=function(){return"SafeHtml{"+this.la+"}"};var $c=function(a){if(a instanceof Zc&&a.constructor===Zc&&a.Rd===Yc)return a.la;za("expected object of type SafeHtml, got '"+a+"' of type "+m(a));return"type_error:SafeHtml"},Yc={};Zc.prototype.ye=function(a){this.la=a;return this};!ib&&!y||y&&9<=Number(qb)||ib&&z("1.9.1");y&&z("9");var bd=function(a,b){Sa(b,function(b,d){"style"==d?a.style.cssText=b:"class"==d?a.className=b:"for"==d?a.htmlFor=b:ad.hasOwnProperty(d)?a.setAttribute(ad[d],b):0==d.lastIndexOf("aria-",0)||0==d.lastIndexOf("data-",0)?a.setAttribute(d,b):a[d]=b})},ad={cellpadding:"cellPadding",cellspacing:"cellSpacing",colspan:"colSpan",frameborder:"frameBorder",height:"height",maxlength:"maxLength",nonce:"nonce",role:"role",rowspan:"rowSpan",type:"type",usemap:"useMap",valign:"vAlign",width:"width"};var cd=function(a,b,c){this.Be=c;this.ae=a;this.Ne=b;this.Vb=0;this.Ob=null};cd.prototype.get=function(){var a;0<this.Vb?(this.Vb--,a=this.Ob,this.Ob=a.next,a.next=null):a=this.ae();return a};cd.prototype.put=function(a){this.Ne(a);this.Vb<this.Be&&(this.Vb++,a.next=this.Ob,this.Ob=a)};var dd=function(a){l.setTimeout(function(){throw a;},0)},ed,fd=function(){var a=l.MessageChannel;"undefined"===typeof a&&"undefined"!==typeof window&&window.postMessage&&window.addEventListener&&!x("Presto")&&(a=function(){var a=document.createElement("IFRAME");a.style.display="none";a.src="";document.documentElement.appendChild(a);var b=a.contentWindow,a=b.document;a.open();a.write("");a.close();var c="callImmediate"+Math.random(),d="file:"==b.location.protocol?"*":b.location.protocol+"//"+b.location.host,
a=q(function(a){if(("*"==d||a.origin==d)&&a.data==c)this.port1.onmessage()},this);b.addEventListener("message",a,!1);this.port1={};this.port2={postMessage:function(){b.postMessage(c,d)}}});if("undefined"!==typeof a&&!x("Trident")&&!x("MSIE")){var b=new a,c={},d=c;b.port1.onmessage=function(){if(void 0!==c.next){c=c.next;var a=c.cd;c.cd=null;a()}};return function(a){d.next={cd:a};d=d.next;b.port2.postMessage(0)}}return"undefined"!==typeof document&&"onreadystatechange"in document.createElement("SCRIPT")?
function(a){var b=document.createElement("SCRIPT");b.onreadystatechange=function(){b.onreadystatechange=null;b.parentNode.removeChild(b);b=null;a();a=null};document.documentElement.appendChild(b)}:function(a){l.setTimeout(a,0)}};var gd=function(){this.pc=this.Ma=null},id=new cd(function(){return new hd},function(a){a.reset()},100);gd.prototype.add=function(a,b){var c=id.get();c.set(a,b);this.pc?this.pc.next=c:(w(!this.Ma),this.Ma=c);this.pc=c};gd.prototype.remove=function(){var a=null;this.Ma&&(a=this.Ma,this.Ma=this.Ma.next,this.Ma||(this.pc=null),a.next=null);return a};var hd=function(){this.next=this.scope=this.zc=null};hd.prototype.set=function(a,b){this.zc=a;this.scope=b;this.next=null};
hd.prototype.reset=function(){this.next=this.scope=this.zc=null};var nd=function(a,b){jd||kd();ld||(jd(),ld=!0);md.add(a,b)},jd,kd=function(){var a=l.Promise;if(-1!=String(a).indexOf("[native code]")){var b=a.resolve(void 0);jd=function(){b.then(od)}}else jd=function(){var a=od;!p(l.setImmediate)||l.Window&&l.Window.prototype&&!x("Edge")&&l.Window.prototype.setImmediate==l.setImmediate?(ed||(ed=fd()),ed(a)):l.setImmediate(a)}},ld=!1,md=new gd,od=function(){for(var a;a=md.remove();){try{a.zc.call(a.scope)}catch(b){dd(b)}id.put(a)}ld=!1};var pd=function(a){a.prototype.then=a.prototype.then;a.prototype.$goog_Thenable=!0},qd=function(a){if(!a)return!1;try{return!!a.$goog_Thenable}catch(b){return!1}};var F=function(a,b){this.J=0;this.ma=void 0;this.Pa=this.ha=this.s=null;this.Mb=this.yc=!1;if(a!=ba)try{var c=this;a.call(b,function(a){rd(c,2,a)},function(a){if(!(a instanceof sd))try{if(a instanceof Error)throw a;throw Error("Promise rejected.");}catch(e){}rd(c,3,a)})}catch(d){rd(this,3,d)}},td=function(){this.next=this.context=this.Va=this.Ga=this.child=null;this.lb=!1};td.prototype.reset=function(){this.context=this.Va=this.Ga=this.child=null;this.lb=!1};
var ud=new cd(function(){return new td},function(a){a.reset()},100),vd=function(a,b,c){var d=ud.get();d.Ga=a;d.Va=b;d.context=c;return d},G=function(a){if(a instanceof F)return a;var b=new F(ba);rd(b,2,a);return b},H=function(a){return new F(function(b,c){c(a)})},xd=function(a,b,c){wd(a,b,c,null)||nd(ka(b,a))},yd=function(a){return new F(function(b){var c=a.length,d=[];if(c)for(var e=function(a,e,f){c--;d[a]=e?{ke:!0,value:f}:{ke:!1,reason:f};0==c&&b(d)},f=0,g;f<a.length;f++)g=a[f],xd(g,ka(e,f,!0),
ka(e,f,!1));else b(d)})};F.prototype.then=function(a,b,c){null!=a&&Ca(a,"opt_onFulfilled should be a function.");null!=b&&Ca(b,"opt_onRejected should be a function. Did you pass opt_context as the second argument instead of the third?");return zd(this,p(a)?a:null,p(b)?b:null,c)};pd(F);var Bd=function(a,b){b=vd(b,b,void 0);b.lb=!0;Ad(a,b);return a};F.prototype.l=function(a,b){return zd(this,null,a,b)};F.prototype.cancel=function(a){0==this.J&&nd(function(){var b=new sd(a);Cd(this,b)},this)};
var Cd=function(a,b){if(0==a.J)if(a.s){var c=a.s;if(c.ha){for(var d=0,e=null,f=null,g=c.ha;g&&(g.lb||(d++,g.child==a&&(e=g),!(e&&1<d)));g=g.next)e||(f=g);e&&(0==c.J&&1==d?Cd(c,b):(f?(d=f,w(c.ha),w(null!=d),d.next==c.Pa&&(c.Pa=d),d.next=d.next.next):Dd(c),Ed(c,e,3,b)))}a.s=null}else rd(a,3,b)},Ad=function(a,b){a.ha||2!=a.J&&3!=a.J||Fd(a);w(null!=b.Ga);a.Pa?a.Pa.next=b:a.ha=b;a.Pa=b},zd=function(a,b,c,d){var e=vd(null,null,null);e.child=new F(function(a,g){e.Ga=b?function(c){try{var e=b.call(d,c);a(e)}catch(ua){g(ua)}}:
a;e.Va=c?function(b){try{var e=c.call(d,b);void 0===e&&b instanceof sd?g(b):a(e)}catch(ua){g(ua)}}:g});e.child.s=a;Ad(a,e);return e.child};F.prototype.Xe=function(a){w(1==this.J);this.J=0;rd(this,2,a)};F.prototype.Ye=function(a){w(1==this.J);this.J=0;rd(this,3,a)};
var rd=function(a,b,c){0==a.J&&(a===c&&(b=3,c=new TypeError("Promise cannot resolve to itself")),a.J=1,wd(c,a.Xe,a.Ye,a)||(a.ma=c,a.J=b,a.s=null,Fd(a),3!=b||c instanceof sd||Gd(a,c)))},wd=function(a,b,c,d){if(a instanceof F)return null!=b&&Ca(b,"opt_onFulfilled should be a function."),null!=c&&Ca(c,"opt_onRejected should be a function. Did you pass opt_context as the second argument instead of the third?"),Ad(a,vd(b||ba,c||null,d)),!0;if(qd(a))return a.then(b,c,d),!0;if(ha(a))try{var e=a.then;if(p(e))return Hd(a,
e,b,c,d),!0}catch(f){return c.call(d,f),!0}return!1},Hd=function(a,b,c,d,e){var f=!1,g=function(a){f||(f=!0,c.call(e,a))},k=function(a){f||(f=!0,d.call(e,a))};try{b.call(a,g,k)}catch(t){k(t)}},Fd=function(a){a.yc||(a.yc=!0,nd(a.fe,a))},Dd=function(a){var b=null;a.ha&&(b=a.ha,a.ha=b.next,b.next=null);a.ha||(a.Pa=null);null!=b&&w(null!=b.Ga);return b};F.prototype.fe=function(){for(var a;a=Dd(this);)Ed(this,a,this.J,this.ma);this.yc=!1};
var Ed=function(a,b,c,d){if(3==c&&b.Va&&!b.lb)for(;a&&a.Mb;a=a.s)a.Mb=!1;if(b.child)b.child.s=null,Id(b,c,d);else try{b.lb?b.Ga.call(b.context):Id(b,c,d)}catch(e){Jd.call(null,e)}ud.put(b)},Id=function(a,b,c){2==b?a.Ga.call(a.context,c):a.Va&&a.Va.call(a.context,c)},Gd=function(a,b){a.Mb=!0;nd(function(){a.Mb&&Jd.call(null,b)})},Jd=dd,sd=function(a){u.call(this,a)};r(sd,u);sd.prototype.name="cancel";/*
 Portions of this code are from MochiKit, received by
 The Closure Authors under the MIT license. All other code is Copyright
 2005-2009 The Closure Authors. All Rights Reserved.
*/
var Kd=function(a,b){this.gc=[];this.ud=a;this.fd=b||null;this.qb=this.Ta=!1;this.ma=void 0;this.Tc=this.Yc=this.tc=!1;this.nc=0;this.s=null;this.uc=0};Kd.prototype.cancel=function(a){if(this.Ta)this.ma instanceof Kd&&this.ma.cancel();else{if(this.s){var b=this.s;delete this.s;a?b.cancel(a):(b.uc--,0>=b.uc&&b.cancel())}this.ud?this.ud.call(this.fd,this):this.Tc=!0;this.Ta||Ld(this,new Md)}};Kd.prototype.dd=function(a,b){this.tc=!1;Nd(this,a,b)};
var Nd=function(a,b,c){a.Ta=!0;a.ma=c;a.qb=!b;Od(a)},Qd=function(a){if(a.Ta){if(!a.Tc)throw new Pd;a.Tc=!1}};Kd.prototype.callback=function(a){Qd(this);Rd(a);Nd(this,!0,a)};
var Ld=function(a,b){Qd(a);Rd(b);Nd(a,!1,b)},Rd=function(a){w(!(a instanceof Kd),"An execution sequence may not be initiated with a blocking Deferred.")},Vd=function(a){var b=Sd("https://apis.google.com/js/client.js?onload="+Td);Ud(b,null,a,void 0)},Ud=function(a,b,c,d){w(!a.Yc,"Blocking Deferreds can not be re-used");a.gc.push([b,c,d]);a.Ta&&Od(a)};Kd.prototype.then=function(a,b,c){var d,e,f=new F(function(a,b){d=a;e=b});Ud(this,d,function(a){a instanceof Md?f.cancel():e(a)});return f.then(a,b,c)};
pd(Kd);
var Wd=function(a){return Ha(a.gc,function(a){return p(a[1])})},Od=function(a){if(a.nc&&a.Ta&&Wd(a)){var b=a.nc,c=Xd[b];c&&(l.clearTimeout(c.rb),delete Xd[b]);a.nc=0}a.s&&(a.s.uc--,delete a.s);for(var b=a.ma,d=c=!1;a.gc.length&&!a.tc;){var e=a.gc.shift(),f=e[0],g=e[1],e=e[2];if(f=a.qb?g:f)try{var k=f.call(e||a.fd,b);void 0!==k&&(a.qb=a.qb&&(k==b||k instanceof Error),a.ma=b=k);if(qd(b)||"function"===typeof l.Promise&&b instanceof l.Promise)d=!0,a.tc=!0}catch(t){b=t,a.qb=!0,Wd(a)||(c=!0)}}a.ma=b;d&&
(k=q(a.dd,a,!0),d=q(a.dd,a,!1),b instanceof Kd?(Ud(b,k,d),b.Yc=!0):b.then(k,d));c&&(b=new Yd(b),Xd[b.rb]=b,a.nc=b.rb)},Pd=function(){u.call(this)};r(Pd,u);Pd.prototype.message="Deferred has already fired";Pd.prototype.name="AlreadyCalledError";var Md=function(){u.call(this)};r(Md,u);Md.prototype.message="Deferred was canceled";Md.prototype.name="CanceledError";var Yd=function(a){this.rb=l.setTimeout(q(this.We,this),0);this.N=a};
Yd.prototype.We=function(){w(Xd[this.rb],"Cannot throw an error that is not scheduled.");delete Xd[this.rb];throw this.N;};var Xd={};var Sd=function(a){var b=new Xc;b.Zb=a;return Zd(b)},Zd=function(a){var b={},c=b.document||document,d;a instanceof Xc&&a.constructor===Xc&&a.Ud===Wc?d=a.Zb:(za("expected object of type TrustedResourceUrl, got '"+a+"' of type "+m(a)),d="type_error:TrustedResourceUrl");var e=document.createElement("SCRIPT");a={Cd:e,Bb:void 0};var f=new Kd($d,a),g=null,k=null!=b.timeout?b.timeout:5E3;0<k&&(g=window.setTimeout(function(){ae(e,!0);Ld(f,new be(1,"Timeout reached for loading script "+d))},k),a.Bb=g);e.onload=
e.onreadystatechange=function(){e.readyState&&"loaded"!=e.readyState&&"complete"!=e.readyState||(ae(e,b.hf||!1,g),f.callback(null))};e.onerror=function(){ae(e,!0,g);Ld(f,new be(0,"Error while loading script "+d))};a=b.attributes||{};Za(a,{type:"text/javascript",charset:"UTF-8",src:d});bd(e,a);ce(c).appendChild(e);return f},ce=function(a){var b;return(b=(a||document).getElementsByTagName("HEAD"))&&0!=b.length?b[0]:a.documentElement},$d=function(){if(this&&this.Cd){var a=this.Cd;a&&"SCRIPT"==a.tagName&&
ae(a,!0,this.Bb)}},ae=function(a,b,c){null!=c&&l.clearTimeout(c);a.onload=ba;a.onerror=ba;a.onreadystatechange=ba;b&&window.setTimeout(function(){a&&a.parentNode&&a.parentNode.removeChild(a)},0)},be=function(a,b){var c="Jsloader error (code #"+a+")";b&&(c+=": "+b);u.call(this,c);this.code=a};r(be,u);var de=function(){zb.call(this);this.ba=new Gb(this);this.Xd=this;this.Ic=null};r(de,zb);de.prototype[Cb]=!0;h=de.prototype;h.addEventListener=function(a,b,c,d){Mb(this,a,b,c,d)};h.removeEventListener=function(a,b,c,d){Vb(this,a,b,c,d)};
h.dispatchEvent=function(a){ee(this);var b,c=this.Ic;if(c){b=[];for(var d=1;c;c=c.Ic)b.push(c),w(1E3>++d,"infinite loop")}c=this.Xd;d=a.type||a;if(n(a))a=new Ab(a,c);else if(a instanceof Ab)a.target=a.target||c;else{var e=a;a=new Ab(d,c);Za(a,e)}var e=!0,f;if(b)for(var g=b.length-1;!a.Ya&&0<=g;g--)f=a.currentTarget=b[g],e=fe(f,d,!0,a)&&e;a.Ya||(f=a.currentTarget=c,e=fe(f,d,!0,a)&&e,a.Ya||(e=fe(f,d,!1,a)&&e));if(b)for(g=0;!a.Ya&&g<b.length;g++)f=a.currentTarget=b[g],e=fe(f,d,!1,a)&&e;return e};
h.Ra=function(){de.Vc.Ra.call(this);if(this.ba){var a=this.ba,b=0,c;for(c in a.A){for(var d=a.A[c],e=0;e<d.length;e++)++b,Fb(d[e]);delete a.A[c];a.Cb--}}this.Ic=null};h.listen=function(a,b,c,d){ee(this);return this.ba.add(String(a),b,!1,c,d)};
var Ub=function(a,b,c,d,e){a.ba.add(String(b),c,!0,d,e)},fe=function(a,b,c,d){b=a.ba.A[String(b)];if(!b)return!0;b=b.concat();for(var e=!0,f=0;f<b.length;++f){var g=b[f];if(g&&!g.cb&&g.Gb==c){var k=g.listener,t=g.Nb||g.src;g.Fb&&Ib(a.ba,g);e=!1!==k.call(t,d)&&e}}return e&&0!=d.Bd};de.prototype.Ac=function(a,b,c,d){return this.ba.Ac(String(a),b,c,d)};var ee=function(a){w(a.ba,"Event target is not initialized. Did you call the superclass (goog.events.EventTarget) constructor?")};var ge="StopIteration"in l?l.StopIteration:{message:"StopIteration",stack:""},he=function(){};he.prototype.next=function(){throw ge;};he.prototype.Wd=function(){return this};var ie=function(a,b){this.ca={};this.v=[];this.pa=this.i=0;var c=arguments.length;if(1<c){if(c%2)throw Error("Uneven number of arguments");for(var d=0;d<c;d+=2)this.set(arguments[d],arguments[d+1])}else a&&this.addAll(a)};h=ie.prototype;h.ld=function(){return this.i};h.X=function(){je(this);for(var a=[],b=0;b<this.v.length;b++)a.push(this.ca[this.v[b]]);return a};h.ja=function(){je(this);return this.v.concat()};h.mb=function(a){return ke(this.ca,a)};
h.Ib=function(a,b){if(this===a)return!0;if(this.i!=a.ld())return!1;b=b||le;je(this);for(var c,d=0;c=this.v[d];d++)if(!b(this.get(c),a.get(c)))return!1;return!0};var le=function(a,b){return a===b};ie.prototype.remove=function(a){return ke(this.ca,a)?(delete this.ca[a],this.i--,this.pa++,this.v.length>2*this.i&&je(this),!0):!1};
var je=function(a){if(a.i!=a.v.length){for(var b=0,c=0;b<a.v.length;){var d=a.v[b];ke(a.ca,d)&&(a.v[c++]=d);b++}a.v.length=c}if(a.i!=a.v.length){for(var e={},c=b=0;b<a.v.length;)d=a.v[b],ke(e,d)||(a.v[c++]=d,e[d]=1),b++;a.v.length=c}};h=ie.prototype;h.get=function(a,b){return ke(this.ca,a)?this.ca[a]:b};h.set=function(a,b){ke(this.ca,a)||(this.i++,this.v.push(a),this.pa++);this.ca[a]=b};
h.addAll=function(a){var b;a instanceof ie?(b=a.ja(),a=a.X()):(b=Ua(a),a=Ta(a));for(var c=0;c<b.length;c++)this.set(b[c],a[c])};h.forEach=function(a,b){for(var c=this.ja(),d=0;d<c.length;d++){var e=c[d],f=this.get(e);a.call(b,f,e,this)}};h.clone=function(){return new ie(this)};h.Wd=function(a){je(this);var b=0,c=this.pa,d=this,e=new he;e.next=function(){if(c!=d.pa)throw Error("The map has changed since the iterator was created");if(b>=d.v.length)throw ge;var e=d.v[b++];return a?e:d.ca[e]};return e};
var ke=function(a,b){return Object.prototype.hasOwnProperty.call(a,b)};var me=function(a){if(a.X&&"function"==typeof a.X)return a.X();if(n(a))return a.split("");if(fa(a)){for(var b=[],c=a.length,d=0;d<c;d++)b.push(a[d]);return b}return Ta(a)},ne=function(a){if(a.ja&&"function"==typeof a.ja)return a.ja();if(!a.X||"function"!=typeof a.X){if(fa(a)||n(a)){var b=[];a=a.length;for(var c=0;c<a;c++)b.push(c);return b}return Ua(a)}},oe=function(a,b){if(a.forEach&&"function"==typeof a.forEach)a.forEach(b,void 0);else if(fa(a)||n(a))Ea(a,b,void 0);else for(var c=ne(a),d=me(a),
e=d.length,f=0;f<e;f++)b.call(void 0,d[f],c&&c[f],a)};var pe=function(a,b,c,d,e){this.reset(a,b,c,d,e)};pe.prototype.hd=null;var qe=0;pe.prototype.reset=function(a,b,c,d,e){"number"==typeof e||qe++;d||la();this.ub=a;this.Ge=b;delete this.hd};pe.prototype.Fd=function(a){this.ub=a};var re=function(a){this.He=a;this.nd=this.vc=this.ub=this.s=null},se=function(a,b){this.name=a;this.value=b};se.prototype.toString=function(){return this.name};var te=new se("SEVERE",1E3),ue=new se("CONFIG",700),ve=new se("FINE",500);re.prototype.getParent=function(){return this.s};re.prototype.Fd=function(a){this.ub=a};var we=function(a){if(a.ub)return a.ub;if(a.s)return we(a.s);za("Root logger has no level set.");return null};
re.prototype.log=function(a,b,c){if(a.value>=we(this).value)for(p(b)&&(b=b()),a=new pe(a,String(b),this.He),c&&(a.hd=c),c="log:"+a.Ge,l.console&&(l.console.timeStamp?l.console.timeStamp(c):l.console.markTimeline&&l.console.markTimeline(c)),l.msWriteProfilerMark&&l.msWriteProfilerMark(c),c=this;c;){b=c;var d=a;if(b.nd)for(var e=0,f;f=b.nd[e];e++)f(d);c=c.getParent()}};
var xe={},ye=null,ze=function(a){ye||(ye=new re(""),xe[""]=ye,ye.Fd(ue));var b;if(!(b=xe[a])){b=new re(a);var c=a.lastIndexOf("."),d=a.substr(c+1),c=ze(a.substr(0,c));c.vc||(c.vc={});c.vc[d]=b;b.s=c;xe[a]=b}return b};var I=function(a,b){a&&a.log(ve,b,void 0)};var Ae=function(a,b,c){if(p(a))c&&(a=q(a,c));else if(a&&"function"==typeof a.handleEvent)a=q(a.handleEvent,a);else throw Error("Invalid listener argument");return 2147483647<Number(b)?-1:l.setTimeout(a,b||0)},Be=function(a){var b=null;return(new F(function(c,d){b=Ae(function(){c(void 0)},a);-1==b&&d(Error("Failed to schedule timer."))})).l(function(a){l.clearTimeout(b);throw a;})};var Ce=/^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/,De=function(a,b){if(a){a=a.split("&");for(var c=0;c<a.length;c++){var d=a[c].indexOf("="),e,f=null;0<=d?(e=a[c].substring(0,d),f=a[c].substring(d+1)):e=a[c];b(e,f?decodeURIComponent(f.replace(/\+/g," ")):"")}}};var J=function(a){de.call(this);this.headers=new ie;this.rc=a||null;this.ra=!1;this.qc=this.b=null;this.tb=this.sd=this.Ub="";this.Da=this.Dc=this.Rb=this.xc=!1;this.ib=0;this.mc=null;this.Ad="";this.oc=this.Me=this.Nd=!1};r(J,de);var Ee=J.prototype,Fe=ze("goog.net.XhrIo");Ee.T=Fe;var Ge=/^https?$/i,He=["POST","PUT"];
J.prototype.send=function(a,b,c,d){if(this.b)throw Error("[goog.net.XhrIo] Object is active with another request="+this.Ub+"; newUri="+a);b=b?b.toUpperCase():"GET";this.Ub=a;this.tb="";this.sd=b;this.xc=!1;this.ra=!0;this.b=this.rc?this.rc.nb():uc.nb();this.qc=this.rc?tc(this.rc):tc(uc);this.b.onreadystatechange=q(this.xd,this);this.Me&&"onprogress"in this.b&&(this.b.onprogress=q(function(a){this.wd(a,!0)},this),this.b.upload&&(this.b.upload.onprogress=q(this.wd,this)));try{I(this.T,Ie(this,"Opening Xhr")),
this.Dc=!0,this.b.open(b,String(a),!0),this.Dc=!1}catch(f){I(this.T,Ie(this,"Error opening Xhr: "+f.message));this.N(5,f);return}a=c||"";var e=this.headers.clone();d&&oe(d,function(a,b){e.set(b,a)});d=Ja(e.ja());c=l.FormData&&a instanceof l.FormData;!Ka(He,b)||d||c||e.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");e.forEach(function(a,b){this.b.setRequestHeader(b,a)},this);this.Ad&&(this.b.responseType=this.Ad);"withCredentials"in this.b&&this.b.withCredentials!==this.Nd&&(this.b.withCredentials=
this.Nd);try{Je(this),0<this.ib&&(this.oc=Ke(this.b),I(this.T,Ie(this,"Will abort after "+this.ib+"ms if incomplete, xhr2 "+this.oc)),this.oc?(this.b.timeout=this.ib,this.b.ontimeout=q(this.Bb,this)):this.mc=Ae(this.Bb,this.ib,this)),I(this.T,Ie(this,"Sending request")),this.Rb=!0,this.b.send(a),this.Rb=!1}catch(f){I(this.T,Ie(this,"Send error: "+f.message)),this.N(5,f)}};var Ke=function(a){return y&&z(9)&&ga(a.timeout)&&void 0!==a.ontimeout},Ia=function(a){return"content-type"==a.toLowerCase()};
J.prototype.Bb=function(){"undefined"!=typeof aa&&this.b&&(this.tb="Timed out after "+this.ib+"ms, aborting",I(this.T,Ie(this,this.tb)),this.dispatchEvent("timeout"),this.abort(8))};J.prototype.N=function(a,b){this.ra=!1;this.b&&(this.Da=!0,this.b.abort(),this.Da=!1);this.tb=b;Le(this);Me(this)};var Le=function(a){a.xc||(a.xc=!0,a.dispatchEvent("complete"),a.dispatchEvent("error"))};
J.prototype.abort=function(){this.b&&this.ra&&(I(this.T,Ie(this,"Aborting")),this.ra=!1,this.Da=!0,this.b.abort(),this.Da=!1,this.dispatchEvent("complete"),this.dispatchEvent("abort"),Me(this))};J.prototype.Ra=function(){this.b&&(this.ra&&(this.ra=!1,this.Da=!0,this.b.abort(),this.Da=!1),Me(this,!0));J.Vc.Ra.call(this)};J.prototype.xd=function(){this.isDisposed()||(this.Dc||this.Rb||this.Da?Ne(this):this.Ke())};J.prototype.Ke=function(){Ne(this)};
var Ne=function(a){if(a.ra&&"undefined"!=typeof aa)if(a.qc[1]&&4==Oe(a)&&2==Pe(a))I(a.T,Ie(a,"Local request error detected and ignored"));else if(a.Rb&&4==Oe(a))Ae(a.xd,0,a);else if(a.dispatchEvent("readystatechange"),4==Oe(a)){I(a.T,Ie(a,"Request complete"));a.ra=!1;try{var b=Pe(a),c;a:switch(b){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:c=!0;break a;default:c=!1}var d;if(!(d=c)){var e;if(e=0===b){var f=String(a.Ub).match(Ce)[1]||null;if(!f&&l.self&&l.self.location)var g=l.self.location.protocol,
f=g.substr(0,g.length-1);e=!Ge.test(f?f.toLowerCase():"")}d=e}if(d)a.dispatchEvent("complete"),a.dispatchEvent("success");else{var k;try{k=2<Oe(a)?a.b.statusText:""}catch(t){I(a.T,"Can not get status: "+t.message),k=""}a.tb=k+" ["+Pe(a)+"]";Le(a)}}finally{Me(a)}}};J.prototype.wd=function(a,b){w("progress"===a.type,"goog.net.EventType.PROGRESS is of the same type as raw XHR progress.");this.dispatchEvent(Qe(a,"progress"));this.dispatchEvent(Qe(a,b?"downloadprogress":"uploadprogress"))};
var Qe=function(a,b){return{type:b,lengthComputable:a.lengthComputable,loaded:a.loaded,total:a.total}},Me=function(a,b){if(a.b){Je(a);var c=a.b,d=a.qc[0]?ba:null;a.b=null;a.qc=null;b||a.dispatchEvent("ready");try{c.onreadystatechange=d}catch(e){(a=a.T)&&a.log(te,"Problem encountered resetting onreadystatechange: "+e.message,void 0)}}},Je=function(a){a.b&&a.oc&&(a.b.ontimeout=null);ga(a.mc)&&(l.clearTimeout(a.mc),a.mc=null)},Oe=function(a){return a.b?a.b.readyState:0},Pe=function(a){try{return 2<Oe(a)?
a.b.status:-1}catch(b){return-1}},Re=function(a){try{return a.b?a.b.responseText:""}catch(b){return I(a.T,"Can not get responseText: "+b.message),""}},Ie=function(a,b){return b+" ["+a.sd+" "+a.Ub+" "+Pe(a)+"]"};var Se=function(a,b){this.ia=this.Ka=this.na="";this.Xa=null;this.Ca=this.ta="";this.P=this.Ae=!1;var c;a instanceof Se?(this.P=void 0!==b?b:a.P,Te(this,a.na),c=a.Ka,K(this),this.Ka=c,Ue(this,a.ia),Ve(this,a.Xa),We(this,a.ta),Xe(this,a.$.clone()),a=a.Ca,K(this),this.Ca=a):a&&(c=String(a).match(Ce))?(this.P=!!b,Te(this,c[1]||"",!0),a=c[2]||"",K(this),this.Ka=Ye(a),Ue(this,c[3]||"",!0),Ve(this,c[4]),We(this,c[5]||"",!0),Xe(this,c[6]||"",!0),a=c[7]||"",K(this),this.Ca=Ye(a)):(this.P=!!b,this.$=new L(null,
0,this.P))};Se.prototype.toString=function(){var a=[],b=this.na;b&&a.push(Ze(b,$e,!0),":");var c=this.ia;if(c||"file"==b)a.push("//"),(b=this.Ka)&&a.push(Ze(b,$e,!0),"@"),a.push(encodeURIComponent(String(c)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),c=this.Xa,null!=c&&a.push(":",String(c));if(c=this.ta)this.ia&&"/"!=c.charAt(0)&&a.push("/"),a.push(Ze(c,"/"==c.charAt(0)?af:bf,!0));(c=this.$.toString())&&a.push("?",c);(c=this.Ca)&&a.push("#",Ze(c,cf));return a.join("")};
Se.prototype.resolve=function(a){var b=this.clone(),c=!!a.na;c?Te(b,a.na):c=!!a.Ka;if(c){var d=a.Ka;K(b);b.Ka=d}else c=!!a.ia;c?Ue(b,a.ia):c=null!=a.Xa;d=a.ta;if(c)Ve(b,a.Xa);else if(c=!!a.ta){if("/"!=d.charAt(0))if(this.ia&&!this.ta)d="/"+d;else{var e=b.ta.lastIndexOf("/");-1!=e&&(d=b.ta.substr(0,e+1)+d)}e=d;if(".."==e||"."==e)d="";else if(v(e,"./")||v(e,"/.")){for(var d=0==e.lastIndexOf("/",0),e=e.split("/"),f=[],g=0;g<e.length;){var k=e[g++];"."==k?d&&g==e.length&&f.push(""):".."==k?((1<f.length||
1==f.length&&""!=f[0])&&f.pop(),d&&g==e.length&&f.push("")):(f.push(k),d=!0)}d=f.join("/")}else d=e}c?We(b,d):c=""!==a.$.toString();c?Xe(b,Ye(a.$.toString())):c=!!a.Ca;c&&(a=a.Ca,K(b),b.Ca=a);return b};Se.prototype.clone=function(){return new Se(this)};
var Te=function(a,b,c){K(a);a.na=c?Ye(b,!0):b;a.na&&(a.na=a.na.replace(/:$/,""))},Ue=function(a,b,c){K(a);a.ia=c?Ye(b,!0):b},Ve=function(a,b){K(a);if(b){b=Number(b);if(isNaN(b)||0>b)throw Error("Bad port number "+b);a.Xa=b}else a.Xa=null},We=function(a,b,c){K(a);a.ta=c?Ye(b,!0):b},Xe=function(a,b,c){K(a);b instanceof L?(a.$=b,a.$.Sc(a.P)):(c||(b=Ze(b,df)),a.$=new L(b,0,a.P))},M=function(a,b,c){K(a);a.$.set(b,c)},ef=function(a,b){K(a);a.$.remove(b)},K=function(a){if(a.Ae)throw Error("Tried to modify a read-only Uri");
};Se.prototype.Sc=function(a){this.P=a;this.$&&this.$.Sc(a);return this};
var ff=function(a){return a instanceof Se?a.clone():new Se(a,void 0)},gf=function(a,b){var c=new Se(null,void 0);Te(c,"https");a&&Ue(c,a);b&&We(c,b);return c},Ye=function(a,b){return a?b?decodeURI(a.replace(/%25/g,"%2525")):decodeURIComponent(a):""},Ze=function(a,b,c){return n(a)?(a=encodeURI(a).replace(b,hf),c&&(a=a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a):null},hf=function(a){a=a.charCodeAt(0);return"%"+(a>>4&15).toString(16)+(a&15).toString(16)},$e=/[#\/\?@]/g,bf=/[\#\?:]/g,af=/[\#\?]/g,df=/[\#\?@]/g,
cf=/#/g,L=function(a,b,c){this.i=this.j=null;this.M=a||null;this.P=!!c},jf=function(a){a.j||(a.j=new ie,a.i=0,a.M&&De(a.M,function(b,c){a.add(decodeURIComponent(b.replace(/\+/g," ")),c)}))},lf=function(a){var b=ne(a);if("undefined"==typeof b)throw Error("Keys are undefined");var c=new L(null,0,void 0);a=me(a);for(var d=0;d<b.length;d++){var e=b[d],f=a[d];ea(f)?kf(c,e,f):c.add(e,f)}return c};h=L.prototype;h.ld=function(){jf(this);return this.i};
h.add=function(a,b){jf(this);this.M=null;a=this.O(a);var c=this.j.get(a);c||this.j.set(a,c=[]);c.push(b);this.i=Aa(this.i)+1;return this};h.remove=function(a){jf(this);a=this.O(a);return this.j.mb(a)?(this.M=null,this.i=Aa(this.i)-this.j.get(a).length,this.j.remove(a)):!1};h.mb=function(a){jf(this);a=this.O(a);return this.j.mb(a)};h.ja=function(){jf(this);for(var a=this.j.X(),b=this.j.ja(),c=[],d=0;d<b.length;d++)for(var e=a[d],f=0;f<e.length;f++)c.push(b[d]);return c};
h.X=function(a){jf(this);var b=[];if(n(a))this.mb(a)&&(b=Oa(b,this.j.get(this.O(a))));else{a=this.j.X();for(var c=0;c<a.length;c++)b=Oa(b,a[c])}return b};h.set=function(a,b){jf(this);this.M=null;a=this.O(a);this.mb(a)&&(this.i=Aa(this.i)-this.j.get(a).length);this.j.set(a,[b]);this.i=Aa(this.i)+1;return this};h.get=function(a,b){a=a?this.X(a):[];return 0<a.length?String(a[0]):b};var kf=function(a,b,c){a.remove(b);0<c.length&&(a.M=null,a.j.set(a.O(b),Qa(c)),a.i=Aa(a.i)+c.length)};
L.prototype.toString=function(){if(this.M)return this.M;if(!this.j)return"";for(var a=[],b=this.j.ja(),c=0;c<b.length;c++)for(var d=b[c],e=encodeURIComponent(String(d)),d=this.X(d),f=0;f<d.length;f++){var g=e;""!==d[f]&&(g+="="+encodeURIComponent(String(d[f])));a.push(g)}return this.M=a.join("&")};L.prototype.clone=function(){var a=new L;a.M=this.M;this.j&&(a.j=this.j.clone(),a.i=this.i);return a};L.prototype.O=function(a){a=String(a);this.P&&(a=a.toLowerCase());return a};
L.prototype.Sc=function(a){a&&!this.P&&(jf(this),this.M=null,this.j.forEach(function(a,c){var b=c.toLowerCase();c!=b&&(this.remove(c),kf(this,b,a))},this));this.P=a};var mf=function(){var a=N();return y&&!!qb&&11==qb||/Edge\/\d+/.test(a)},nf=function(){return l.window&&l.window.location.href||""},of=function(a,b){var c=[],d;for(d in a)d in b?typeof a[d]!=typeof b[d]?c.push(d):ea(a[d])?Wa(a[d],b[d])||c.push(d):"object"==typeof a[d]&&null!=a[d]&&null!=b[d]?0<of(a[d],b[d]).length&&c.push(d):a[d]!==b[d]&&c.push(d):c.push(d);for(d in b)d in a||c.push(d);return c},qf=function(){var a;a=N();a="Chrome"!=pf(a)?null:(a=a.match(/\sChrome\/(\d+)/i))&&2==a.length?parseInt(a[1],
10):null;return a&&30>a?!1:!y||!qb||9<qb},rf=function(a){a=(a||N()).toLowerCase();return a.match(/android/)||a.match(/webos/)||a.match(/iphone|ipad|ipod/)||a.match(/blackberry/)||a.match(/windows phone/)||a.match(/iemobile/)?!0:!1},sf=function(a){a=a||l.window;try{a.close()}catch(b){}},tf=function(a,b,c){var d=Math.floor(1E9*Math.random()).toString();b=b||500;c=c||600;var e=(window.screen.availHeight-c)/2,f=(window.screen.availWidth-b)/2;b={width:b,height:c,top:0<e?e:0,left:0<f?f:0,location:!0,resizable:!0,
statusbar:!0,toolbar:!1};d&&(b.target=d);"Firefox"==pf(N())&&(a=a||"http://localhost",b.scrollbars=!0);var g;c=a||"about:blank";(d=b)||(d={});a=window;b=c instanceof fc?c:jc("undefined"!=typeof c.href?c.href:String(c));c=d.target||c.target;e=[];for(g in d)switch(g){case "width":case "height":case "top":case "left":e.push(g+"="+d[g]);break;case "target":case "noreferrer":break;default:e.push(g+"="+(d[g]?1:0))}g=e.join(",");(x("iPhone")&&!x("iPod")&&!x("iPad")||x("iPad")||x("iPod"))&&a.navigator&&a.navigator.standalone&&
c&&"_self"!=c?(g=a.document.createElement("A"),"undefined"!=typeof HTMLAnchorElement&&"undefined"!=typeof Location&&"undefined"!=typeof Element&&(e=g&&(g instanceof HTMLAnchorElement||!(g instanceof Location||g instanceof Element)),f=ha(g)?g.constructor.displayName||g.constructor.name||Object.prototype.toString.call(g):void 0===g?"undefined":null===g?"null":typeof g,w(e,"Argument is not a HTMLAnchorElement (or a non-Element mock); got: %s",f)),b=b instanceof fc?b:jc(b),g.href=gc(b),g.setAttribute("target",
c),d.noreferrer&&g.setAttribute("rel","noreferrer"),d=document.createEvent("MouseEvent"),d.initMouseEvent("click",!0,!0,a,1),g.dispatchEvent(d),g={}):d.noreferrer?(g=a.open("",c,g),d=gc(b),g&&(hb&&v(d,";")&&(d="'"+d.replace(/'/g,"%27")+"'"),g.opener=null,a=dc("b/12014412, meta tag with sanitized URL"),va.test(d)&&(-1!=d.indexOf("&")&&(d=d.replace(oa,"&amp;")),-1!=d.indexOf("<")&&(d=d.replace(pa,"&lt;")),-1!=d.indexOf(">")&&(d=d.replace(qa,"&gt;")),-1!=d.indexOf('"')&&(d=d.replace(ra,"&quot;")),-1!=
d.indexOf("'")&&(d=d.replace(sa,"&#39;")),-1!=d.indexOf("\x00")&&(d=d.replace(ta,"&#0;"))),d='<META HTTP-EQUIV="refresh" content="0; url='+d+'">',Ba(cc(a),"must provide justification"),w(!/^[\s\xa0]*$/.test(cc(a)),"must provide non-empty justification"),g.document.write($c((new Zc).ye(d))),g.document.close())):g=a.open(gc(b),c,g);if(g)try{g.focus()}catch(k){}return g},uf=function(a){return new F(function(b){var c=function(){Be(2E3).then(function(){if(!a||a.closed)b();else return c()})};return c()})},
vf=function(){var a=null;return(new F(function(b){"complete"==l.document.readyState?b():(a=function(){b()},Tb(window,"load",a))})).l(function(b){Vb(window,"load",a);throw b;})},O=function(a){switch(a||l.navigator&&l.navigator.product||""){case "ReactNative":return"ReactNative";default:return"undefined"!==typeof l.process?"Node":"Browser"}},wf=function(){var a=O();return"ReactNative"===a||"Node"===a},pf=function(a){var b=a.toLowerCase();if(v(b,"opera/")||v(b,"opr/")||v(b,"opios/"))return"Opera";if(v(b,
"iemobile"))return"IEMobile";if(v(b,"msie")||v(b,"trident/"))return"IE";if(v(b,"edge/"))return"Edge";if(v(b,"firefox/"))return"Firefox";if(v(b,"silk/"))return"Silk";if(v(b,"blackberry"))return"Blackberry";if(v(b,"webos"))return"Webos";if(!v(b,"safari/")||v(b,"chrome/")||v(b,"crios/")||v(b,"android"))if(!v(b,"chrome/")&&!v(b,"crios/")||v(b,"edge/")){if(v(b,"android"))return"Android";if((a=a.match(/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/))&&2==a.length)return a[1]}else return"Chrome";else return"Safari";return"Other"},
xf=function(a){var b=O(void 0);return("Browser"===b?pf(N()):b)+"/JsCore/"+a},N=function(){return l.navigator&&l.navigator.userAgent||""},yf=function(a){a=a.split(".");for(var b=l,c=0;c<a.length&&"object"==typeof b&&null!=b;c++)b=b[a[c]];c!=a.length&&(b=void 0);return b},Af=function(){var a;if(!(a=!l.location||!l.location.protocol||"http:"!=l.location.protocol&&"https:"!=l.location.protocol||wf())){var b;a:{try{var c=l.localStorage,d=zf();if(c){c.setItem(d,"1");c.removeItem(d);b=mf()?!!l.indexedDB:
!0;break a}}catch(e){}b=!1}a=!b}return!a},Bf=function(a){a=a||N();return rf(a)||"Firefox"==pf(a)?!1:!0},Cf=function(a){return"undefined"===typeof a?null:oc(a)},Df=function(a){var b={},c;for(c in a)a.hasOwnProperty(c)&&null!==a[c]&&void 0!==a[c]&&(b[c]=a[c]);return b},Ef=function(a){if(null!==a){var b;try{b=lc(a)}catch(c){try{b=JSON.parse(a)}catch(d){throw c;}}return b}},zf=function(a){return a?a:""+Math.floor(1E9*Math.random()).toString()},Ff=function(a){a=a||N();return"Safari"==pf(a)||a.toLowerCase().match(/iphone|ipad|ipod/)?
!1:!0},Gf=function(){var a=l.___jsl;if(a&&a.H)for(var b in a.H)if(a.H[b].r=a.H[b].r||[],a.H[b].L=a.H[b].L||[],a.H[b].r=a.H[b].L.concat(),a.CP)for(var c=0;c<a.CP.length;c++)a.CP[c]=null},Hf=function(a,b,c,d){if(a>b)throw Error("Short delay should be less than long delay!");this.Te=a;this.Fe=b;a=d||O();this.ze=rf(c||N())||"ReactNative"===a};Hf.prototype.get=function(){return this.ze?this.Fe:this.Te};var If;try{var Jf={};Object.defineProperty(Jf,"abcd",{configurable:!0,enumerable:!0,value:1});Object.defineProperty(Jf,"abcd",{configurable:!0,enumerable:!0,value:2});If=2==Jf.abcd}catch(a){If=!1}
var P=function(a,b,c){If?Object.defineProperty(a,b,{configurable:!0,enumerable:!0,value:c}):a[b]=c},Kf=function(a,b){if(b)for(var c in b)b.hasOwnProperty(c)&&P(a,c,b[c])},Lf=function(a){var b={},c;for(c in a)a.hasOwnProperty(c)&&(b[c]=a[c]);return b},Mf=function(a,b){if(!b||!b.length)return!0;if(!a)return!1;for(var c=0;c<b.length;c++){var d=a[b[c]];if(void 0===d||null===d||""===d)return!1}return!0},Nf=function(a){var b=a;if("object"==typeof a&&null!=a){var b="length"in a?[]:{},c;for(c in a)P(b,c,
Nf(a[c]))}return b};var Of=["client_id","response_type","scope","redirect_uri","state"],Pf={Od:{xb:500,wb:600,providerId:"facebook.com",fc:Of},Pd:{xb:500,wb:620,providerId:"github.com",fc:Of},Qd:{xb:515,wb:680,providerId:"google.com",fc:Of},Vd:{xb:485,wb:705,providerId:"twitter.com",fc:"oauth_consumer_key oauth_nonce oauth_signature oauth_signature_method oauth_timestamp oauth_token oauth_version".split(" ")}},Qf=function(a){for(var b in Pf)if(Pf[b].providerId==a)return Pf[b];return null},Rf=function(a){return(a=Qf(a))&&
a.fc||[]};var Q=function(a,b){this.code="auth/"+a;this.message=b||Sf[a]||""};r(Q,Error);Q.prototype.K=function(){return{name:this.code,code:this.code,message:this.message}};
var Sf={"argument-error":"","app-not-authorized":"This app, identified by the domain where it's hosted, is not authorized to use Firebase Authentication with the provided API key. Review your key configuration in the Google API console.","cors-unsupported":"This browser is not supported.","credential-already-in-use":"This credential is already associated with a different user account.","custom-token-mismatch":"The custom token corresponds to a different audience.","requires-recent-login":"This operation is sensitive and requires recent authentication. Log in again before retrying this request.",
"email-already-in-use":"The email address is already in use by another account.","expired-action-code":"The action code has expired. ","cancelled-popup-request":"This operation has been cancelled due to another conflicting popup being opened.","internal-error":"An internal error has occurred.","invalid-user-token":"The user's credential is no longer valid. The user must sign in again.","invalid-auth-event":"An internal error has occurred.","invalid-custom-token":"The custom token format is incorrect. Please check the documentation.",
"invalid-email":"The email address is badly formatted.","invalid-api-key":"Your API key is invalid, please check you have copied it correctly.","invalid-credential":"The supplied auth credential is malformed or has expired.","invalid-oauth-provider":"EmailAuthProvider is not supported for this operation. This operation only supports OAuth providers.","unauthorized-domain":"This domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains from the Firebase console.",
"invalid-action-code":"The action code is invalid. This can happen if the code is malformed, expired, or has already been used.","wrong-password":"The password is invalid or the user does not have a password.","missing-iframe-start":"An internal error has occurred.","auth-domain-config-required":"Be sure to include authDomain when calling firebase.initializeApp(), by following the instructions in the Firebase console.","app-deleted":"This instance of FirebaseApp has been deleted.","account-exists-with-different-credential":"An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.",
"network-request-failed":"A network error (such as timeout, interrupted connection or unreachable host) has occurred.","no-auth-event":"An internal error has occurred.","no-such-provider":"User was not linked to an account with the given provider.","operation-not-allowed":"The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section.","operation-not-supported-in-this-environment":'This operation is not supported in the environment this application is running on. "location.protocol" must be http or https and web storage must be enabled.',
"popup-blocked":"Unable to establish a connection with the popup. It may have been blocked by the browser.","popup-closed-by-user":"The popup has been closed by the user before finalizing the operation.","provider-already-linked":"User can only be linked to one identity for the given provider.",timeout:"The operation has timed out.","user-token-expired":"The user's credential is no longer valid. The user must sign in again.","too-many-requests":"We have blocked all requests from this device due to unusual activity. Try again later.",
"user-cancelled":"User did not grant your application the permissions it requested.","user-not-found":"There is no user record corresponding to this identifier. The user may have been deleted.","user-disabled":"The user account has been disabled by an administrator.","user-mismatch":"The supplied credentials do not correspond to the previously signed in user.","user-signed-out":"","weak-password":"The password must be 6 characters long or more.","web-storage-unsupported":"This browser is not supported."};var Tf=function(a,b,c,d,e){this.ya=a;this.W=b||null;this.kb=c||null;this.hc=d||null;this.N=e||null;if(this.kb||this.N){if(this.kb&&this.N)throw new Q("invalid-auth-event");if(this.kb&&!this.hc)throw new Q("invalid-auth-event");}else throw new Q("invalid-auth-event");};Tf.prototype.getError=function(){return this.N};Tf.prototype.K=function(){return{type:this.ya,eventId:this.W,urlResponse:this.kb,sessionId:this.hc,error:this.N&&this.N.K()}};var Uf=function(a){var b="unauthorized-domain",c=void 0,d=ff(a);a=d.ia;d=d.na;"http"!=d&&"https"!=d?b="operation-not-supported-in-this-environment":c=ma("This domain (%s) is not authorized to run this operation. Add it to the OAuth redirect domains list in the Firebase console -> Auth section -> Sign in method tab.",a);Q.call(this,b,c)};r(Uf,Q);var Vf=function(a){this.Ee=a.sub;la();this.Hb=a.email||null};var Wf=function(a,b,c,d){var e={};ha(c)?e=c:b&&n(c)&&n(d)?e={oauthToken:c,oauthTokenSecret:d}:!b&&n(c)&&(e={accessToken:c});if(b||!e.idToken&&!e.accessToken)if(b&&e.oauthToken&&e.oauthTokenSecret)P(this,"accessToken",e.oauthToken),P(this,"secret",e.oauthTokenSecret);else{if(b)throw new Q("argument-error","credential failed: expected 2 arguments (the OAuth access token and secret).");throw new Q("argument-error","credential failed: expected 1 argument (the OAuth access token).");}else e.idToken&&P(this,
"idToken",e.idToken),e.accessToken&&P(this,"accessToken",e.accessToken);P(this,"provider",a)};Wf.prototype.Kb=function(a){return Xf(a,Yf(this))};Wf.prototype.td=function(a,b){var c=Yf(this);c.idToken=b;return Zf(a,c)};var Yf=function(a){var b={};a.idToken&&(b.id_token=a.idToken);a.accessToken&&(b.access_token=a.accessToken);a.secret&&(b.oauth_token_secret=a.secret);b.providerId=a.provider;return{postBody:lf(b).toString(),requestUri:Af()?nf():"http://localhost"}};
Wf.prototype.K=function(){var a={provider:this.provider};this.idToken&&(a.oauthIdToken=this.idToken);this.accessToken&&(a.oauthAccessToken=this.accessToken);this.secret&&(a.oauthTokenSecret=this.secret);return a};
var $f=function(a,b,c){var d=!!b,e=c||[];b=function(){Kf(this,{providerId:a,isOAuthProvider:!0});this.Rc=[];this.ed={};"google.com"==a&&this.addScope("profile")};d||(b.prototype.addScope=function(a){Ka(this.Rc,a)||this.Rc.push(a)});b.prototype.setCustomParameters=function(a){this.ed=Xa(a)};b.prototype.me=function(){var a=Df(this.ed),b;for(b in a)a[b]=a[b].toString();a=Xa(a);for(b=0;b<e.length;b++){var c=e[b];c in a&&delete a[c]}return a};b.prototype.ne=function(){return Qa(this.Rc)};b.credential=
function(b,c){return new Wf(a,d,b,c)};Kf(b,{PROVIDER_ID:a});return b},ag=$f("facebook.com",!1,Rf("facebook.com"));ag.prototype.addScope=ag.prototype.addScope||void 0;var bg=$f("github.com",!1,Rf("github.com"));bg.prototype.addScope=bg.prototype.addScope||void 0;var cg=$f("google.com",!1,Rf("google.com"));cg.prototype.addScope=cg.prototype.addScope||void 0;
cg.credential=function(a,b){if(!a&&!b)throw new Q("argument-error","credential failed: must provide the ID token and/or the access token.");return new Wf("google.com",!1,ha(a)?a:{idToken:a||null,accessToken:b||null})};var dg=$f("twitter.com",!0,Rf("twitter.com")),eg=function(a,b){this.Hb=a;this.Jc=b;P(this,"provider","password")};eg.prototype.Kb=function(a){return R(a,fg,{email:this.Hb,password:this.Jc})};eg.prototype.td=function(a,b){return R(a,gg,{idToken:b,email:this.Hb,password:this.Jc})};
eg.prototype.K=function(){return{email:this.Hb,password:this.Jc}};var hg=function(){Kf(this,{providerId:"password",isOAuthProvider:!1})};Kf(hg,{PROVIDER_ID:"password"});var ig={ff:hg,Od:ag,Qd:cg,Pd:bg,Vd:dg},jg=function(a){var b=a&&a.providerId;if(!b)return null;var c=a&&a.oauthAccessToken,d=a&&a.oauthTokenSecret;a=a&&a.oauthIdToken;for(var e in ig)if(ig[e].PROVIDER_ID==b)try{return ig[e].credential({accessToken:c,idToken:a,oauthToken:c,oauthTokenSecret:d})}catch(f){break}return null};var kg=function(a,b,c,d){Q.call(this,a,d);P(this,"email",b);P(this,"credential",c)};r(kg,Q);kg.prototype.K=function(){var a={code:this.code,message:this.message,email:this.email},b=this.credential&&this.credential.K();b&&(Za(a,b),a.providerId=b.provider,delete a.provider);return a};var lg=function(a){if(a.code){var b=a.code||"";0==b.indexOf("auth/")&&(b=b.substring(5));return a.email?new kg(b,a.email,jg(a),a.message):new Q(b,a.message||void 0)}return null};var mg=function(a){this.ef=a};r(mg,sc);mg.prototype.nb=function(){return new this.ef};mg.prototype.Tb=function(){return{}};
var S=function(a,b,c){var d;d="Node"==O();d=l.XMLHttpRequest||d&&firebase.INTERNAL.node&&firebase.INTERNAL.node.XMLHttpRequest;if(!d)throw new Q("internal-error","The XMLHttpRequest compatibility library was not found.");this.m=a;a=b||{};this.Pe=a.secureTokenEndpoint||"https://securetoken.googleapis.com/v1/token";this.Qe=a.secureTokenTimeout||ng;this.Dd=Xa(a.secureTokenHeaders||og);this.ie=a.firebaseEndpoint||"https://www.googleapis.com/identitytoolkit/v3/relyingparty/";this.je=a.firebaseTimeout||
pg;this.kd=Xa(a.firebaseHeaders||qg);c&&(this.kd["X-Client-Version"]=c,this.Dd["X-Client-Version"]=c);this.$d=new xc;this.df=new mg(d)},rg,ng=new Hf(1E4,3E4),og={"Content-Type":"application/x-www-form-urlencoded"},pg=new Hf(1E4,3E4),qg={"Content-Type":"application/json"},tg=function(a,b,c,d,e,f,g){qf()?a=q(a.Se,a):(rg||(rg=new F(function(a,b){sg(a,b)})),a=q(a.Re,a));a(b,c,d,e,f,g)};
S.prototype.Se=function(a,b,c,d,e,f){var g="Node"==O(),k=wf()?g?new J(this.df):new J:new J(this.$d),t;f&&(k.ib=Math.max(0,f),t=setTimeout(function(){k.dispatchEvent("timeout")},f));k.listen("complete",function(){t&&clearTimeout(t);var a=null;try{var c;c=this.b?lc(this.b.responseText):void 0;a=c||null}catch(fj){try{a=JSON.parse(Re(this))||null}catch(gj){a=null}}b&&b(a)});Ub(k,"ready",function(){t&&clearTimeout(t);this.Ba||(this.Ba=!0,this.Ra())});Ub(k,"timeout",function(){t&&clearTimeout(t);this.Ba||
(this.Ba=!0,this.Ra());b&&b(null)});k.send(a,c,d,e)};var Td="__fcb"+Math.floor(1E6*Math.random()).toString(),sg=function(a,b){((window.gapi||{}).client||{}).request?a():(l[Td]=function(){((window.gapi||{}).client||{}).request?a():b(Error("CORS_UNSUPPORTED"))},Vd(function(){b(Error("CORS_UNSUPPORTED"))}))};
S.prototype.Re=function(a,b,c,d,e){var f=this;rg.then(function(){window.gapi.client.setApiKey(f.m);var g=window.gapi.auth.getToken();window.gapi.auth.setToken(null);window.gapi.client.request({path:a,method:c,body:d,headers:e,authType:"none",callback:function(a){window.gapi.auth.setToken(g);b&&b(a)}})}).l(function(a){b&&b({error:{message:a&&a.message||"CORS_UNSUPPORTED"}})})};
var vg=function(a,b){return new F(function(c,d){"refresh_token"==b.grant_type&&b.refresh_token||"authorization_code"==b.grant_type&&b.code?tg(a,a.Pe+"?key="+encodeURIComponent(a.m),function(a){a?a.error?d(ug(a)):a.access_token&&a.refresh_token?c(a):d(new Q("internal-error")):d(new Q("network-request-failed"))},"POST",lf(b).toString(),a.Dd,a.Qe.get()):d(new Q("internal-error"))})},wg=function(a,b,c,d,e){var f=a.ie+b+"?key="+encodeURIComponent(a.m);e&&(f+="&cb="+la().toString());return new F(function(b,
e){tg(a,f,function(a){a?a.error?e(ug(a)):b(a):e(new Q("network-request-failed"))},c,oc(Df(d)),a.kd,a.je.get())})},xg=function(a){if(!$b.test(a.email))throw new Q("invalid-email");},yg=function(a){"email"in a&&xg(a)},Ag=function(a,b){var c=Af()?nf():"http://localhost";return R(a,zg,{identifier:b,continueUri:c}).then(function(a){return a.allProviders||[]})},Cg=function(a){return R(a,Bg,{}).then(function(a){return a.authorizedDomains||[]})},Dg=function(a){if(!a.idToken)throw new Q("internal-error");
};S.prototype.signInAnonymously=function(){return R(this,Eg,{})};S.prototype.updateEmail=function(a,b){return R(this,Fg,{idToken:a,email:b})};S.prototype.updatePassword=function(a,b){return R(this,gg,{idToken:a,password:b})};var Gg={displayName:"DISPLAY_NAME",photoUrl:"PHOTO_URL"};S.prototype.updateProfile=function(a,b){var c={idToken:a},d=[];Sa(Gg,function(a,f){var e=b[f];null===e?d.push(a):f in b&&(c[f]=e)});d.length&&(c.deleteAttribute=d);return R(this,Fg,c)};
S.prototype.sendPasswordResetEmail=function(a){return R(this,Hg,{requestType:"PASSWORD_RESET",email:a})};S.prototype.sendEmailVerification=function(a){return R(this,Ig,{requestType:"VERIFY_EMAIL",idToken:a})};
var Kg=function(a,b,c){return R(a,Jg,{idToken:b,deleteProvider:c})},Lg=function(a){if(!a.requestUri||!a.sessionId&&!a.postBody)throw new Q("internal-error");},Mg=function(a){var b=null;a.needConfirmation?(a.code="account-exists-with-different-credential",b=lg(a)):"FEDERATED_USER_ID_ALREADY_LINKED"==a.errorMessage?(a.code="credential-already-in-use",b=lg(a)):"EMAIL_EXISTS"==a.errorMessage&&(a.code="email-already-in-use",b=lg(a));if(b)throw b;if(!a.idToken)throw new Q("internal-error");},Xf=function(a,
b){b.returnIdpCredential=!0;return R(a,Ng,b)},Zf=function(a,b){b.returnIdpCredential=!0;return R(a,Og,b)},Pg=function(a){if(!a.oobCode)throw new Q("invalid-action-code");};S.prototype.confirmPasswordReset=function(a,b){return R(this,Qg,{oobCode:a,newPassword:b})};S.prototype.checkActionCode=function(a){return R(this,Rg,{oobCode:a})};S.prototype.applyActionCode=function(a){return R(this,Sg,{oobCode:a})};
var Sg={endpoint:"setAccountInfo",I:Pg,gb:"email"},Rg={endpoint:"resetPassword",I:Pg,wa:function(a){if(!a.email||!a.requestType)throw new Q("internal-error");}},Tg={endpoint:"signupNewUser",I:function(a){xg(a);if(!a.password)throw new Q("weak-password");},wa:Dg,xa:!0},zg={endpoint:"createAuthUri"},Ug={endpoint:"deleteAccount",eb:["idToken"]},Jg={endpoint:"setAccountInfo",eb:["idToken","deleteProvider"],I:function(a){if(!ea(a.deleteProvider))throw new Q("internal-error");}},Vg={endpoint:"getAccountInfo"},
Ig={endpoint:"getOobConfirmationCode",eb:["idToken","requestType"],I:function(a){if("VERIFY_EMAIL"!=a.requestType)throw new Q("internal-error");},gb:"email"},Hg={endpoint:"getOobConfirmationCode",eb:["requestType"],I:function(a){if("PASSWORD_RESET"!=a.requestType)throw new Q("internal-error");xg(a)},gb:"email"},Bg={Zd:!0,endpoint:"getProjectConfig",ue:"GET"},Qg={endpoint:"resetPassword",I:Pg,gb:"email"},Fg={endpoint:"setAccountInfo",eb:["idToken"],I:yg,xa:!0},gg={endpoint:"setAccountInfo",eb:["idToken"],
I:function(a){yg(a);if(!a.password)throw new Q("weak-password");},wa:Dg,xa:!0},Eg={endpoint:"signupNewUser",wa:Dg,xa:!0},Ng={endpoint:"verifyAssertion",I:Lg,wa:Mg,xa:!0},Og={endpoint:"verifyAssertion",I:function(a){Lg(a);if(!a.idToken)throw new Q("internal-error");},wa:Mg,xa:!0},Wg={endpoint:"verifyCustomToken",I:function(a){if(!a.token)throw new Q("invalid-custom-token");},wa:Dg,xa:!0},fg={endpoint:"verifyPassword",I:function(a){xg(a);if(!a.password)throw new Q("wrong-password");},wa:Dg,xa:!0},R=
function(a,b,c){if(!Mf(c,b.eb))return H(new Q("internal-error"));var d=b.ue||"POST",e;return G(c).then(b.I).then(function(){b.xa&&(c.returnSecureToken=!0);return wg(a,b.endpoint,d,c,b.Zd||!1)}).then(function(a){return e=a}).then(b.wa).then(function(){if(!b.gb)return e;if(!(b.gb in e))throw new Q("internal-error");return e[b.gb]})},ug=function(a){var b,c;c=(a.error&&a.error.errors&&a.error.errors[0]||{}).reason||"";var d={keyInvalid:"invalid-api-key",ipRefererBlocked:"app-not-authorized"};if(c=d[c]?
new Q(d[c]):null)return c;c=a.error&&a.error.message||"";d={INVALID_CUSTOM_TOKEN:"invalid-custom-token",CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_EMAIL:"invalid-email",INVALID_PASSWORD:"wrong-password",USER_DISABLED:"user-disabled",MISSING_PASSWORD:"internal-error",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",
FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",EMAIL_NOT_FOUND:"user-not-found",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",CORS_UNSUPPORTED:"cors-unsupported",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",WEAK_PASSWORD:"weak-password",OPERATION_NOT_ALLOWED:"operation-not-allowed",
USER_CANCELLED:"user-cancelled"};b=(b=c.match(/^[^\s]+\s*:\s*(.*)$/))&&1<b.length?b[1]:void 0;for(var e in d)if(0===c.indexOf(e))return new Q(d[e],b);!b&&a&&(b=Cf(a));return new Q("internal-error",b)};var Xg=function(a){this.U=a};Xg.prototype.value=function(){return this.U};Xg.prototype.Gd=function(a){this.U.style=a;return this};var Yg=function(a){this.U=a||{}};Yg.prototype.value=function(){return this.U};Yg.prototype.Gd=function(a){this.U.style=a;return this};var $g=function(a){this.cf=a;this.Cc=null;this.vd=Zg(this)};$g.prototype.Hc=function(){return this.vd};
var ah=function(a){var b=new Yg;b.U.where=document.body;b.U.url=a.cf;b.U.messageHandlersFilter=yf("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER");b.U.attributes=b.U.attributes||{};(new Xg(b.U.attributes)).Gd({position:"absolute",top:"-100px",width:"1px",height:"1px"});b.U.dontclear=!0;return b},Zg=function(a){return bh().then(function(){return new F(function(b,c){yf("gapi.iframes.getContext")().open(ah(a).value(),function(d){a.Cc=d;a.Cc.restyle({setHideOnLeave:!1});var e=setTimeout(function(){c(Error("Network Error"))},
ch.get()),f=function(){clearTimeout(e);b()};d.ping(f).then(f,function(){c(Error("Network Error"))})})})})},dh=function(a,b){a.vd.then(function(){a.Cc.register("authEvent",b,yf("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"))})},eh=new Hf(3E3,15E3),ch=new Hf(5E3,15E3),bh=function(){return new F(function(a,b){var c=function(){Gf();yf("gapi.load")("gapi.iframes",{callback:a,ontimeout:function(){Gf();b(Error("Network Error"))},timeout:eh.get()})};if(yf("gapi.iframes.Iframe"))a();else if(yf("gapi.load"))c();
else{var d="__iframefcb"+Math.floor(1E6*Math.random()).toString();l[d]=function(){yf("gapi.load")?c():b(Error("Network Error"))};G(Sd("https://apis.google.com/js/api.js?onload="+d)).l(function(){b(Error("Network Error"))})}})};var fh=function(a,b,c){this.C=a;this.m=b;this.F=c;this.La=null;this.u=gf(this.C,"/__/auth/iframe");M(this.u,"apiKey",this.m);M(this.u,"appName",this.F)};fh.prototype.setVersion=function(a){this.La=a;return this};fh.prototype.toString=function(){this.La?M(this.u,"v",this.La):ef(this.u,"v");return this.u.toString()};
var gh=function(a,b,c,d,e){this.C=a;this.m=b;this.F=c;this.Yd=d;this.La=this.W=this.Pc=null;this.$b=e;this.u=gf(this.C,"/__/auth/handler");M(this.u,"apiKey",this.m);M(this.u,"appName",this.F);M(this.u,"authType",this.Yd)};gh.prototype.setVersion=function(a){this.La=a;return this};
gh.prototype.toString=function(){if(this.$b.isOAuthProvider){M(this.u,"providerId",this.$b.providerId);var a=this.$b.ne();a&&a.length&&M(this.u,"scopes",a.join(","));a=this.$b.me();Va(a)||M(this.u,"customParameters",Cf(a))}this.Pc?M(this.u,"redirectUrl",this.Pc):ef(this.u,"redirectUrl");this.W?M(this.u,"eventId",this.W):ef(this.u,"eventId");this.La?M(this.u,"v",this.La):ef(this.u,"v");return this.u.toString()};
var ih=function(a,b,c,d){this.C=a;this.m=b;this.F=c;d=this.Aa=d||null;this.ve=(new fh(a,b,c)).setVersion(d).toString();this.pd=new $g(this.ve);this.Db=[];hh(this)};ih.prototype.Hc=function(){return this.pd.Hc()};
var jh=function(a,b,c,d,e,f,g,k){a=new gh(a,b,c,d,e);a.Pc=f;a.W=g;return a.setVersion(k).toString()},hh=function(a){dh(a.pd,function(b){var c={};if(b&&b.authEvent){var d=!1;b=b.authEvent||{};if(b.type){if(c=b.error)var e=(c=b.error)&&(c.name||c.code),c=e?new Q(e.substring(5),c.message):null;b=new Tf(b.type,b.eventId,b.urlResponse,b.sessionId,c)}else b=null;for(c=0;c<a.Db.length;c++)d=a.Db[c](b)||d;c={};c.status=d?"ACK":"ERROR";return G(c)}c.status="ERROR";return G(c)})},kh=function(a,b){Na(a.Db,function(a){return a==
b})};var lh=function(a){this.w=a||firebase.INTERNAL.reactNative&&firebase.INTERNAL.reactNative.AsyncStorage;if(!this.w)throw new Q("internal-error","The React Native compatibility library was not found.");};h=lh.prototype;h.get=function(a){return G(this.w.getItem(a)).then(function(a){return a&&Ef(a)})};h.set=function(a,b){return G(this.w.setItem(a,Cf(b)))};h.remove=function(a){return G(this.w.removeItem(a))};h.Na=function(){};h.bb=function(){};var mh=function(){this.w={}};h=mh.prototype;h.get=function(a){return G(this.w[a])};h.set=function(a,b){this.w[a]=b;return G()};h.remove=function(a){delete this.w[a];return G()};h.Na=function(){};h.bb=function(){};var oh=function(){if(!nh()){if("Node"==O())throw new Q("internal-error","The LocalStorage compatibility library was not found.");throw new Q("web-storage-unsupported");}this.w=l.localStorage||firebase.INTERNAL.node.localStorage},nh=function(){var a="Node"==O(),a=l.localStorage||a&&firebase.INTERNAL.node&&firebase.INTERNAL.node.localStorage;if(!a)return!1;try{return a.setItem("__sak","1"),a.removeItem("__sak"),!0}catch(b){return!1}};h=oh.prototype;
h.get=function(a){var b=this;return G().then(function(){var c=b.w.getItem(a);return Ef(c)})};h.set=function(a,b){var c=this;return G().then(function(){var d=Cf(b);null===d?c.remove(a):c.w.setItem(a,d)})};h.remove=function(a){var b=this;return G().then(function(){b.w.removeItem(a)})};h.Na=function(a){l.window&&Mb(l.window,"storage",a)};h.bb=function(a){l.window&&Vb(l.window,"storage",a)};var ph=function(){this.w={}};h=ph.prototype;h.get=function(){return G(null)};h.set=function(){return G()};h.remove=function(){return G()};h.Na=function(){};h.bb=function(){};var rh=function(){if(!qh()){if("Node"==O())throw new Q("internal-error","The SessionStorage compatibility library was not found.");throw new Q("web-storage-unsupported");}this.w=l.sessionStorage||firebase.INTERNAL.node.sessionStorage},qh=function(){var a="Node"==O(),a=l.sessionStorage||a&&firebase.INTERNAL.node&&firebase.INTERNAL.node.sessionStorage;if(!a)return!1;try{return a.setItem("__sak","1"),a.removeItem("__sak"),!0}catch(b){return!1}};h=rh.prototype;
h.get=function(a){var b=this;return G().then(function(){var c=b.w.getItem(a);return Ef(c)})};h.set=function(a,b){var c=this;return G().then(function(){var d=Cf(b);null===d?c.remove(a):c.w.setItem(a,d)})};h.remove=function(a){var b=this;return G().then(function(){b.w.removeItem(a)})};h.Na=function(){};h.bb=function(){};var sh=function(a,b,c,d,e,f){if(!window.indexedDB)throw new Q("web-storage-unsupported");this.be=a;this.Gc=b;this.wc=c;this.Md=d;this.pa=e;this.S={};this.zb=[];this.vb=0;this.we=f||l.indexedDB},th,uh=function(a){return new F(function(b,c){var d=a.we.open(a.be,a.pa);d.onerror=function(a){c(Error(a.target.errorCode))};d.onupgradeneeded=function(b){b=b.target.result;try{b.createObjectStore(a.Gc,{keyPath:a.wc})}catch(f){c(f)}};d.onsuccess=function(a){b(a.target.result)}})},vh=function(a){a.qd||(a.qd=
uh(a));return a.qd},wh=function(a,b){return b.objectStore(a.Gc)},xh=function(a,b,c){return b.transaction([a.Gc],c?"readwrite":"readonly")},yh=function(a){return new F(function(b,c){a.onsuccess=function(a){a&&a.target?b(a.target.result):b()};a.onerror=function(a){c(Error(a.target.errorCode))}})};h=sh.prototype;
h.set=function(a,b){var c=!1,d,e=this;return Bd(vh(this).then(function(b){d=b;b=wh(e,xh(e,d,!0));return yh(b.get(a))}).then(function(f){var g=wh(e,xh(e,d,!0));if(f)return f.value=b,yh(g.put(f));e.vb++;c=!0;f={};f[e.wc]=a;f[e.Md]=b;return yh(g.add(f))}).then(function(){e.S[a]=b}),function(){c&&e.vb--})};h.get=function(a){var b=this;return vh(this).then(function(c){return yh(wh(b,xh(b,c,!1)).get(a))}).then(function(a){return a&&a.value})};
h.remove=function(a){var b=!1,c=this;return Bd(vh(this).then(function(d){b=!0;c.vb++;return yh(wh(c,xh(c,d,!0))["delete"](a))}).then(function(){delete c.S[a]}),function(){b&&c.vb--})};
h.Ve=function(){var a=this;return vh(this).then(function(b){var c=wh(a,xh(a,b,!1));return c.getAll?yh(c.getAll()):new F(function(a,b){var d=[],e=c.openCursor();e.onsuccess=function(b){(b=b.target.result)?(d.push(b.value),b["continue"]()):a(d)};e.onerror=function(a){b(Error(a.target.errorCode))}})}).then(function(b){var c={},d=[];if(0==a.vb){for(d=0;d<b.length;d++)c[b[d][a.wc]]=b[d][a.Md];d=of(a.S,c);a.S=c}return d})};h.Na=function(a){0==this.zb.length&&this.Uc();this.zb.push(a)};
h.bb=function(a){Na(this.zb,function(b){return b==a});0==this.zb.length&&this.jc()};h.Uc=function(){var a=this;this.jc();var b=function(){a.Lc=Be(800).then(q(a.Ve,a)).then(function(b){0<b.length&&Ea(a.zb,function(a){a(b)})}).then(b).l(function(a){"STOP_EVENT"!=a.message&&b()});return a.Lc};b()};h.jc=function(){this.Lc&&this.Lc.cancel("STOP_EVENT")};var Ch=function(){this.gd={Browser:zh,Node:Ah,ReactNative:Bh}[O()]},Dh,zh={Z:oh,Wc:rh},Ah={Z:oh,Wc:rh},Bh={Z:lh,Wc:ph};var Eh=function(a){var b={},c=a.email,d=a.newEmail;a=a.requestType;if(!c||!a)throw Error("Invalid provider user info!");b.fromEmail=d||null;b.email=c;P(this,"operation",a);P(this,"data",Nf(b))};var Fh="First Second Third Fourth Fifth Sixth Seventh Eighth Ninth".split(" "),T=function(a,b){return{name:a||"",fa:"a valid string",optional:!!b,ga:n}},U=function(a){return{name:a||"",fa:"a valid object",optional:!1,ga:ha}},Gh=function(a,b){return{name:a||"",fa:"a function",optional:!!b,ga:p}},Hh=function(){return{name:"",fa:"null",optional:!1,ga:da}},Ih=function(){return{name:"credential",fa:"a valid credential",optional:!1,ga:function(a){return!(!a||!a.Kb)}}},Jh=function(){return{name:"authProvider",
fa:"a valid Auth provider",optional:!1,ga:function(a){return!!(a&&a.providerId&&a.hasOwnProperty&&a.hasOwnProperty("isOAuthProvider"))}}},Kh=function(a,b,c,d){return{name:c||"",fa:a.fa+" or "+b.fa,optional:!!d,ga:function(c){return a.ga(c)||b.ga(c)}}};var Mh=function(a,b){for(var c in b){var d=b[c].name;a[d]=Lh(d,a[c],b[c].a)}},V=function(a,b,c,d){a[b]=Lh(b,c,d)},Lh=function(a,b,c){if(!c)return b;var d=Nh(a);a=function(){var a=Array.prototype.slice.call(arguments),e;a:{e=Array.prototype.slice.call(a);var k;k=0;for(var t=!1,ua=0;ua<c.length;ua++)if(c[ua].optional)t=!0;else{if(t)throw new Q("internal-error","Argument validator encountered a required argument after an optional argument.");k++}t=c.length;if(e.length<k||t<e.length)e="Expected "+(k==
t?1==k?"1 argument":k+" arguments":k+"-"+t+" arguments")+" but got "+e.length+".";else{for(k=0;k<e.length;k++)if(t=c[k].optional&&void 0===e[k],!c[k].ga(e[k])&&!t){e=c[k];if(0>k||k>=Fh.length)throw new Q("internal-error","Argument validator received an unsupported number of arguments.");e=Fh[k]+" argument "+(e.name?'"'+e.name+'" ':"")+"must be "+e.fa+".";break a}e=null}}if(e)throw new Q("argument-error",d+" failed: "+e);return b.apply(this,a)};for(var e in b)a[e]=b[e];for(e in b.prototype)a.prototype[e]=
b.prototype[e];return a},Nh=function(a){a=a.split(".");return a[a.length-1]};var Oh=function(a,b,c,d){this.Ie=a;this.Ed=b;this.Oe=c;this.hb=d;this.R={};Dh||(Dh=new Ch);a=Dh;try{var e;mf()?(th||(th=new sh("firebaseLocalStorageDb","firebaseLocalStorage","fbase_key","value",1)),e=th):e=new a.gd.Z;this.Wa=e}catch(f){this.Wa=new mh,this.hb=!0}try{this.lc=new a.gd.Wc}catch(f){this.lc=new mh}this.Hd=q(this.Id,this);this.S={}},Ph,Qh=function(){Ph||(Ph=new Oh("firebase",":",!Ff(N())&&l.window&&l.window!=l.window.top?!0:!1,Bf()));return Ph};h=Oh.prototype;
h.O=function(a,b){return this.Ie+this.Ed+a.name+(b?this.Ed+b:"")};h.get=function(a,b){return(a.Z?this.Wa:this.lc).get(this.O(a,b))};h.remove=function(a,b){b=this.O(a,b);a.Z&&!this.hb&&(this.S[b]=null);return(a.Z?this.Wa:this.lc).remove(b)};h.set=function(a,b,c){var d=this.O(a,c),e=this,f=a.Z?this.Wa:this.lc;return f.set(d,b).then(function(){return f.get(d)}).then(function(b){a.Z&&!this.hb&&(e.S[d]=b)})};
h.addListener=function(a,b,c){a=this.O(a,b);this.hb||(this.S[a]=l.localStorage.getItem(a));Va(this.R)&&this.Uc();this.R[a]||(this.R[a]=[]);this.R[a].push(c)};h.removeListener=function(a,b,c){a=this.O(a,b);this.R[a]&&(Na(this.R[a],function(a){return a==c}),0==this.R[a].length&&delete this.R[a]);Va(this.R)&&this.jc()};h.Uc=function(){this.Wa.Na(this.Hd);this.hb||Rh(this)};
var Rh=function(a){Sh(a);a.Fc=setInterval(function(){for(var b in a.R){var c=l.localStorage.getItem(b);c!=a.S[b]&&(a.S[b]=c,c=new Bb({type:"storage",key:b,target:window,oldValue:a.S[b],newValue:c}),a.Id(c))}},1E3)},Sh=function(a){a.Fc&&(clearInterval(a.Fc),a.Fc=null)};Oh.prototype.jc=function(){this.Wa.bb(this.Hd);this.hb||Sh(this)};
Oh.prototype.Id=function(a){if(a&&a.le){var b=a.ob.key;if(this.Oe){var c=l.localStorage.getItem(b);a=a.ob.newValue;a!=c&&(a?l.localStorage.setItem(b,a):a||l.localStorage.removeItem(b))}this.S[b]=l.localStorage.getItem(b);this.ad(b)}else Ea(a,q(this.ad,this))};Oh.prototype.ad=function(a){this.R[a]&&Ea(this.R[a],function(a){a()})};var Th=function(a){this.D=a;this.B=Qh()},Uh={name:"pendingRedirect",Z:!1},Vh=function(a){return a.B.set(Uh,"pending",a.D)},Wh=function(a){return a.B.remove(Uh,a.D)},Xh=function(a){return a.B.get(Uh,a.D).then(function(a){return"pending"==a})};var $h=function(a,b,c){var d=this,e=(this.Aa=firebase.SDK_VERSION||null)?xf(this.Aa):null;this.f=new S(b,null,e);this.sa=null;this.C=a;this.m=b;this.F=c;this.Ab=[];this.Sb=!1;this.Xc=q(this.oe,this);this.Za=new Yh(this);this.yd=new Zh(this);this.Kc=new Th(this.m+":"+this.F);this.jb={};this.jb.unknown=this.Za;this.jb.signInViaRedirect=this.Za;this.jb.linkViaRedirect=this.Za;this.jb.signInViaPopup=this.yd;this.jb.linkViaPopup=this.yd;this.dc=this.fb=null;this.Xb=new F(function(a,b){d.fb=a;d.dc=b})};
$h.prototype.reset=function(){var a=this;this.sa=null;this.Xb.cancel();this.Sb=!1;this.dc=this.fb=null;this.Pb&&kh(this.Pb,this.Xc);this.Xb=new F(function(b,c){a.fb=b;a.dc=c})};
var ai=function(a){var b=nf();return Cg(a).then(function(a){a:{for(var c=ff(b).ia,e=0;e<a.length;e++){var f;var g=a[e];f=c;var k=Qc(g);k?f=(f=Qc(f))?k.Ib(f):!1:(k=g.split(".").join("\\."),f=(new RegExp("^(.+\\."+k+"|"+k+")$","i")).test(f));if(f){a=!0;break a}}a=!1}if(!a)throw new Uf(nf());})},bi=function(a){a.Sb||(a.Sb=!0,vf().then(function(){a.Pb=new ih(a.C,a.m,a.F,a.Aa);a.Pb.Hc().l(function(){a.dc(new Q("network-request-failed"));a.reset()});a.Pb.Db.push(a.Xc)}));return a.Xb};
$h.prototype.subscribe=function(a){Ka(this.Ab,a)||this.Ab.push(a);if(!this.Sb){var b=this,c=function(){var a=N();Bf(a)||Ff(a)||bi(b);ci(b.Za)};Xh(this.Kc).then(function(a){a?Wh(b.Kc).then(function(){bi(b)}):c()}).l(function(){c()})}};$h.prototype.unsubscribe=function(a){Na(this.Ab,function(b){return b==a})};
$h.prototype.oe=function(a){if(!a)throw new Q("invalid-auth-event");this.fb&&(this.fb(),this.fb=null);for(var b=!1,c=0;c<this.Ab.length;c++){var d=this.Ab[c];if(d.bd(a.ya,a.W)){(b=this.jb[a.ya])&&b.zd(a,d);b=!0;break}}ci(this.Za);return b};var di=new Hf(2E3,1E4),ei=new Hf(1E4,3E4);$h.prototype.getRedirectResult=function(){return this.Za.getRedirectResult()};
var gi=function(a,b,c,d,e,f){if(!b)return H(new Q("popup-blocked"));if(f)return bi(a),G();a.sa||(a.sa=ai(a.f));return a.sa.then(function(){return bi(a)}).then(function(){fi(d);var f=jh(a.C,a.m,a.F,c,d,null,e,a.Aa);(b||l.window).location.href=gc(jc(f))}).l(function(b){"auth/network-request-failed"==b.code&&(a.sa=null);throw b;})},hi=function(a,b,c,d){a.sa||(a.sa=ai(a.f));return a.sa.then(function(){fi(c);var e=jh(a.C,a.m,a.F,b,c,nf(),d,a.Aa);Vh(a.Kc).then(function(){l.window.location.href=gc(jc(e))})})},
ii=function(a,b,c,d,e){var f=new Q("popup-closed-by-user");return a.Xb.l(function(){}).then(function(){return uf(d)}).then(function(){return Be(di.get()).then(function(){b.Ja(c,null,f,e)})})},fi=function(a){if(!a.isOAuthProvider)throw new Q("invalid-oauth-provider");},ji={},ki=function(a,b,c){var d=b+":"+c;ji[d]||(ji[d]=new $h(a,b,c));return ji[d]},Yh=function(a){this.B=a;this.yb=this.cc=this.$a=this.aa=null;this.Oc=!1};
Yh.prototype.zd=function(a,b){if(!a)return H(new Q("invalid-auth-event"));this.Oc=!0;var c=a.ya,d=a.W;"unknown"==c?(this.aa||li(this,!1,null,null),a=G()):a=a.N?this.Mc(a,b):b.pb(c,d)?this.Nc(a,b):H(new Q("invalid-auth-event"));return a};var ci=function(a){a.Oc||(a.Oc=!0,li(a,!1,null,null))};Yh.prototype.Mc=function(a){this.aa||li(this,!0,null,a.getError());return G()};
Yh.prototype.Nc=function(a,b){var c=this,d=a.ya;b=b.pb(d,a.W);var e=a.kb;a=a.hc;var f="signInViaRedirect"==d||"linkViaRedirect"==d;if(this.aa)return G();this.yb&&this.yb.cancel();return b(e,a).then(function(a){c.aa||li(c,f,a,null)}).l(function(a){c.aa||li(c,f,null,a)})};var li=function(a,b,c,d){b?d?(a.aa=function(){return H(d)},a.cc&&a.cc(d)):(a.aa=function(){return G(c)},a.$a&&a.$a(c)):(a.aa=function(){return G({user:null})},a.$a&&a.$a({user:null}));a.$a=null;a.cc=null};
Yh.prototype.getRedirectResult=function(){var a=this;this.$c||(this.$c=new F(function(b,c){a.aa?a.aa().then(b,c):(a.$a=b,a.cc=c,mi(a))}));return this.$c};var mi=function(a){var b=new Q("timeout");a.yb&&a.yb.cancel();a.yb=Be(ei.get()).then(function(){a.aa||li(a,!0,null,b)})},Zh=function(a){this.B=a};Zh.prototype.zd=function(a,b){if(!a)return H(new Q("invalid-auth-event"));var c=a.ya,d=a.W;return a.N?this.Mc(a,b):b.pb(c,d)?this.Nc(a,b):H(new Q("invalid-auth-event"))};
Zh.prototype.Mc=function(a,b){b.Ja(a.ya,null,a.getError(),a.W);return G()};Zh.prototype.Nc=function(a,b){var c=a.W,d=a.ya;return b.pb(d,c)(a.kb,a.hc).then(function(a){b.Ja(d,a,null,c)}).l(function(a){b.Ja(d,null,a,c)})};var ni=function(a){this.f=a;this.za=this.V=null;this.Sa=0};ni.prototype.K=function(){return{apiKey:this.f.m,refreshToken:this.V,accessToken:this.za,expirationTime:this.Sa}};
var pi=function(a,b){var c=b.idToken,d=b.refreshToken;b=oi(b.expiresIn);a.za=c;a.Sa=b;a.V=d},oi=function(a){return la()+1E3*parseInt(a,10)},qi=function(a,b){return vg(a.f,b).then(function(b){a.za=b.access_token;a.Sa=oi(b.expires_in);a.V=b.refresh_token;return{accessToken:a.za,expirationTime:a.Sa,refreshToken:a.V}}).l(function(b){"auth/user-token-expired"==b.code&&(a.V=null);throw b;})},ri=function(a){return!(!a.za||a.V)};
ni.prototype.getToken=function(a){a=!!a;return ri(this)?H(new Q("user-token-expired")):a||!this.za||la()>this.Sa-3E4?this.V?qi(this,{grant_type:"refresh_token",refresh_token:this.V}):G(null):G({accessToken:this.za,expirationTime:this.Sa,refreshToken:this.V})};var si=function(a,b,c,d,e){Kf(this,{uid:a,displayName:d||null,photoURL:e||null,email:c||null,providerId:b})},ti=function(a,b){Ab.call(this,a);for(var c in b)this[c]=b[c]};r(ti,Ab);
var W=function(a,b,c){this.Y=[];this.m=a.apiKey;this.F=a.appName;this.C=a.authDomain||null;a=firebase.SDK_VERSION?xf(firebase.SDK_VERSION):null;this.f=new S(this.m,null,a);this.ea=new ni(this.f);ui(this,b.idToken);pi(this.ea,b);P(this,"refreshToken",this.ea.V);vi(this,c||{});de.call(this);this.Yb=!1;this.C&&Af()&&(this.o=ki(this.C,this.m,this.F));this.ic=[];this.sc=G()};r(W,de);
W.prototype.ua=function(a,b){var c=Array.prototype.slice.call(arguments,1),d=this;return this.sc=this.sc.then(function(){return a.apply(d,c)},function(){return a.apply(d,c)})};
var ui=function(a,b){a.rd=b;P(a,"_lat",b)},wi=function(a,b){Na(a.ic,function(a){return a==b})},xi=function(a){for(var b=[],c=0;c<a.ic.length;c++)b.push(a.ic[c](a));return yd(b).then(function(){return a})},yi=function(a){a.o&&!a.Yb&&(a.Yb=!0,a.o.subscribe(a))},vi=function(a,b){Kf(a,{uid:b.uid,displayName:b.displayName||null,photoURL:b.photoURL||null,email:b.email||null,emailVerified:b.emailVerified||!1,isAnonymous:b.isAnonymous||!1,providerData:[]})};P(W.prototype,"providerId","firebase");
var zi=function(){},Ai=function(a){return G().then(function(){if(a.de)throw new Q("app-deleted");})},Bi=function(a){return Ga(a.providerData,function(a){return a.providerId})},Di=function(a,b){b&&(Ci(a,b.providerId),a.providerData.push(b))},Ci=function(a,b){Na(a.providerData,function(a){return a.providerId==b})},Ei=function(a,b,c){("uid"!=b||c)&&a.hasOwnProperty(b)&&P(a,b,c)};
W.prototype.copy=function(a){var b=this;b!=a&&(Kf(this,{uid:a.uid,displayName:a.displayName,photoURL:a.photoURL,email:a.email,emailVerified:a.emailVerified,isAnonymous:a.isAnonymous,providerData:[]}),Ea(a.providerData,function(a){Di(b,a)}),this.ea=a.ea,P(this,"refreshToken",this.ea.V))};W.prototype.reload=function(){var a=this;return Ai(this).then(function(){return Fi(a).then(function(){return xi(a)}).then(zi)})};
var Fi=function(a){return a.getToken().then(function(b){var c=a.isAnonymous;return Gi(a,b).then(function(){c||Ei(a,"isAnonymous",!1);return b}).l(function(b){"auth/user-token-expired"==b.code&&(a.dispatchEvent(new ti("userDeleted")),Hi(a));throw b;})})};
W.prototype.getToken=function(a){var b=this,c=ri(this.ea);return Ai(this).then(function(){return b.ea.getToken(a)}).then(function(a){if(!a)throw new Q("internal-error");a.accessToken!=b.rd&&(ui(b,a.accessToken),b.Fa());Ei(b,"refreshToken",a.refreshToken);return a.accessToken}).l(function(a){if("auth/user-token-expired"==a.code&&!c)return xi(b).then(function(){Ei(b,"refreshToken",null);throw a;});throw a;})};
var Ii=function(a,b){b.idToken&&a.rd!=b.idToken&&(pi(a.ea,b),a.Fa(),ui(a,b.idToken),Ei(a,"refreshToken",a.ea.V))};W.prototype.Fa=function(){this.dispatchEvent(new ti("tokenChanged"))};var Gi=function(a,b){return R(a.f,Vg,{idToken:b}).then(q(a.Le,a))};
W.prototype.Le=function(a){a=a.users;if(!a||!a.length)throw new Q("internal-error");a=a[0];vi(this,{uid:a.localId,displayName:a.displayName,photoURL:a.photoUrl,email:a.email,emailVerified:!!a.emailVerified});for(var b=Ji(a),c=0;c<b.length;c++)Di(this,b[c]);Ei(this,"isAnonymous",!(this.email&&a.passwordHash)&&!(this.providerData&&this.providerData.length))};
var Ji=function(a){return(a=a.providerUserInfo)&&a.length?Ga(a,function(a){return new si(a.rawId,a.providerId,a.email,a.displayName,a.photoUrl)}):[]};W.prototype.reauthenticate=function(a){var b=this;return this.c(a.Kb(this.f).then(function(a){var c;a:{var e=a.idToken.split(".");if(3==e.length){for(var e=e[1],f=(4-e.length%4)%4,g=0;g<f;g++)e+=".";try{var k=lc(vb(e));if(k.sub&&k.iss&&k.aud&&k.exp){c=new Vf(k);break a}}catch(t){}}c=null}if(!c||b.uid!=c.Ee)throw new Q("user-mismatch");Ii(b,a);return b.reload()}))};
var Ki=function(a,b){return Fi(a).then(function(){if(Ka(Bi(a),b))return xi(a).then(function(){throw new Q("provider-already-linked");})})};h=W.prototype;h.Ce=function(a){var b=this;return this.c(Ki(this,a.provider).then(function(){return b.getToken()}).then(function(c){return a.td(b.f,c)}).then(q(this.jd,this)))};h.link=function(a){return this.ua(this.Ce,a)};h.jd=function(a){Ii(this,a);var b=this;return this.reload().then(function(){return b})};
h.$e=function(a){var b=this;return this.c(this.getToken().then(function(c){return b.f.updateEmail(c,a)}).then(function(a){Ii(b,a);return b.reload()}))};h.updateEmail=function(a){return this.ua(this.$e,a)};h.af=function(a){var b=this;return this.c(this.getToken().then(function(c){return b.f.updatePassword(c,a)}).then(function(a){Ii(b,a);return b.reload()}))};h.updatePassword=function(a){return this.ua(this.af,a)};
h.bf=function(a){if(void 0===a.displayName&&void 0===a.photoURL)return Ai(this);var b=this;return this.c(this.getToken().then(function(c){return b.f.updateProfile(c,{displayName:a.displayName,photoUrl:a.photoURL})}).then(function(a){Ii(b,a);Ei(b,"displayName",a.displayName||null);Ei(b,"photoURL",a.photoUrl||null);return xi(b)}).then(zi))};h.updateProfile=function(a){return this.ua(this.bf,a)};
h.Ze=function(a){var b=this;return this.c(Fi(this).then(function(c){return Ka(Bi(b),a)?Kg(b.f,c,[a]).then(function(a){var c={};Ea(a.providerUserInfo||[],function(a){c[a.providerId]=!0});Ea(Bi(b),function(a){c[a]||Ci(b,a)});return xi(b)}):xi(b).then(function(){throw new Q("no-such-provider");})}))};h.unlink=function(a){return this.ua(this.Ze,a)};h.ce=function(){var a=this;return this.c(this.getToken().then(function(b){return R(a.f,Ug,{idToken:b})}).then(function(){a.dispatchEvent(new ti("userDeleted"))})).then(function(){Hi(a)})};
h.delete=function(){return this.ua(this.ce)};h.bd=function(a,b){return"linkViaPopup"==a&&(this.ka||null)==b&&this.da||"linkViaRedirect"==a&&(this.bc||null)==b?!0:!1};h.Ja=function(a,b,c,d){"linkViaPopup"==a&&d==(this.ka||null)&&(c&&this.Ha?this.Ha(c):b&&!c&&this.da&&this.da(b),this.G&&(this.G.cancel(),this.G=null),delete this.da,delete this.Ha)};h.pb=function(a,b){return"linkViaPopup"==a&&b==(this.ka||null)||"linkViaRedirect"==a&&(this.bc||null)==b?q(this.ge,this):null};
h.Jb=function(){return zf(this.uid+":::")};
var Mi=function(a,b){if(!Af())return H(new Q("operation-not-supported-in-this-environment"));var c=Qf(b.providerId),d=a.Jb(),e=null;!Bf()&&a.C&&b.isOAuthProvider&&(e=jh(a.C,a.m,a.F,"linkViaPopup",b,null,d,firebase.SDK_VERSION||null));var f=tf(e,c&&c.xb,c&&c.wb),c=Ki(a,b.providerId).then(function(){return xi(a)}).then(function(){Li(a);return a.getToken()}).then(function(){return gi(a.o,f,"linkViaPopup",b,d,!!e)}).then(function(){return new F(function(b,c){a.Ja("linkViaPopup",null,new Q("cancelled-popup-request"),
a.ka||null);a.da=b;a.Ha=c;a.ka=d;a.G=ii(a.o,a,"linkViaPopup",f,d)})}).then(function(a){f&&sf(f);return a}).l(function(a){f&&sf(f);throw a;});return a.c(c)};W.prototype.linkWithPopup=function(a){var b=Mi(this,a);return this.ua(function(){return b})};
W.prototype.De=function(a){if(!Af())return H(new Q("operation-not-supported-in-this-environment"));var b=this,c=null,d=this.Jb(),e=Ki(this,a.providerId).then(function(){Li(b);return b.getToken()}).then(function(){b.bc=d;return xi(b)}).then(function(a){b.Ia&&(a=b.Ia,a=a.B.set(Ni,b.K(),a.D));return a}).then(function(){return hi(b.o,"linkViaRedirect",a,d)}).l(function(a){c=a;if(b.Ia)return Oi(b.Ia);throw c;}).then(function(){if(c)throw c;});return this.c(e)};
W.prototype.linkWithRedirect=function(a){return this.ua(this.De,a)};var Li=function(a){if(!a.o||!a.Yb){if(a.o&&!a.Yb)throw new Q("internal-error");throw new Q("auth-domain-config-required");}};W.prototype.ge=function(a,b){var c=this;this.G&&(this.G.cancel(),this.G=null);var d=null,e=this.getToken().then(function(d){return Zf(c.f,{requestUri:a,sessionId:b,idToken:d})}).then(function(a){d=jg(a);return c.jd(a)}).then(function(a){return{user:a,credential:d}});return this.c(e)};
W.prototype.sendEmailVerification=function(){var a=this;return this.c(this.getToken().then(function(b){return a.f.sendEmailVerification(b)}).then(function(b){if(a.email!=b)return a.reload()}).then(function(){}))};var Hi=function(a){for(var b=0;b<a.Y.length;b++)a.Y[b].cancel("app-deleted");a.Y=[];a.de=!0;P(a,"refreshToken",null);a.o&&a.o.unsubscribe(a)};W.prototype.c=function(a){var b=this;this.Y.push(a);Bd(a,function(){Ma(b.Y,a)});return a};W.prototype.toJSON=function(){return this.K()};
W.prototype.K=function(){var a={uid:this.uid,displayName:this.displayName,photoURL:this.photoURL,email:this.email,emailVerified:this.emailVerified,isAnonymous:this.isAnonymous,providerData:[],apiKey:this.m,appName:this.F,authDomain:this.C,stsTokenManager:this.ea.K(),redirectEventId:this.bc||null};Ea(this.providerData,function(b){a.providerData.push(Lf(b))});return a};
var Pi=function(a){if(!a.apiKey)return null;var b={apiKey:a.apiKey,authDomain:a.authDomain,appName:a.appName},c={};if(a.stsTokenManager&&a.stsTokenManager.accessToken&&a.stsTokenManager.expirationTime)c.idToken=a.stsTokenManager.accessToken,c.refreshToken=a.stsTokenManager.refreshToken||null,c.expiresIn=(a.stsTokenManager.expirationTime-la())/1E3;else return null;var d=new W(b,c,a);a.providerData&&Ea(a.providerData,function(a){if(a){var b={};Kf(b,a);Di(d,b)}});a.redirectEventId&&(d.bc=a.redirectEventId);
return d},Qi=function(a,b,c){var d=new W(a,b);c&&(d.Ia=c);return d.reload().then(function(){return d})};var Ri=function(a){this.D=a;this.B=Qh()},Ni={name:"redirectUser",Z:!1},Oi=function(a){return a.B.remove(Ni,a.D)},Si=function(a,b){return a.B.get(Ni,a.D).then(function(a){a&&b&&(a.authDomain=b);return Pi(a||{})})};var Ti=function(a){this.D=a;this.B=Qh()},Ui={name:"authUser",Z:!0},Vi=function(a,b){return a.B.set(Ui,b.K(),a.D)},Wi=function(a){return a.B.remove(Ui,a.D)},Xi=function(a,b){return a.B.get(Ui,a.D).then(function(a){a&&b&&(a.authDomain=b);return Pi(a||{})})};var Y=function(a){this.Qa=!1;P(this,"app",a);if(X(this).options&&X(this).options.apiKey)a=firebase.SDK_VERSION?xf(firebase.SDK_VERSION):null,this.f=new S(X(this).options&&X(this).options.apiKey,null,a);else throw new Q("invalid-api-key");this.Y=[];this.Oa=[];this.Je=firebase.INTERNAL.createSubscribe(q(this.xe,this));Yi(this,null);this.oa=new Ti(X(this).options.apiKey+":"+X(this).name);this.ab=new Ri(X(this).options.apiKey+":"+X(this).name);this.Eb=this.c(Zi(this));this.va=this.c($i(this));this.Ec=
!1;this.Bc=q(this.Ue,this);this.Kd=q(this.Ua,this);this.Ld=q(this.te,this);this.Jd=q(this.se,this);aj(this);this.INTERNAL={};this.INTERNAL.delete=q(this.delete,this)};Y.prototype.toJSON=function(){return{apiKey:X(this).options.apiKey,authDomain:X(this).options.authDomain,appName:X(this).name,currentUser:Z(this)&&Z(this).K()}};
var bj=function(a){return a.ee||H(new Q("auth-domain-config-required"))},aj=function(a){var b=X(a).options.authDomain,c=X(a).options.apiKey;b&&Af()&&(a.ee=a.Eb.then(function(){if(!a.Qa)return a.o=ki(b,c,X(a).name),a.o.subscribe(a),Z(a)&&yi(Z(a)),a.Qc&&(yi(a.Qc),a.Qc=null),a.o}))};h=Y.prototype;h.bd=function(a,b){switch(a){case "unknown":case "signInViaRedirect":return!0;case "signInViaPopup":return this.ka==b&&!!this.da;default:return!1}};
h.Ja=function(a,b,c,d){"signInViaPopup"==a&&this.ka==d&&(c&&this.Ha?this.Ha(c):b&&!c&&this.da&&this.da(b),this.G&&(this.G.cancel(),this.G=null),delete this.da,delete this.Ha)};h.pb=function(a,b){return"signInViaRedirect"==a||"signInViaPopup"==a&&this.ka==b&&this.da?q(this.he,this):null};
h.he=function(a,b){var c=this;a={requestUri:a,sessionId:b};this.G&&(this.G.cancel(),this.G=null);var d=null,e=Xf(c.f,a).then(function(a){d=jg(a);return a});a=c.Eb.then(function(){return e}).then(function(a){return cj(c,a)}).then(function(){return{user:Z(c),credential:d}});return this.c(a)};h.Jb=function(){return zf()};
h.signInWithPopup=function(a){if(!Af())return H(new Q("operation-not-supported-in-this-environment"));var b=this,c=Qf(a.providerId),d=this.Jb(),e=null;!Bf()&&X(this).options.authDomain&&a.isOAuthProvider&&(e=jh(X(this).options.authDomain,X(this).options.apiKey,X(this).name,"signInViaPopup",a,null,d,firebase.SDK_VERSION||null));var f=tf(e,c&&c.xb,c&&c.wb),c=bj(this).then(function(b){return gi(b,f,"signInViaPopup",a,d,!!e)}).then(function(){return new F(function(a,c){b.Ja("signInViaPopup",null,new Q("cancelled-popup-request"),
b.ka);b.da=a;b.Ha=c;b.ka=d;b.G=ii(b.o,b,"signInViaPopup",f,d)})}).then(function(a){f&&sf(f);return a}).l(function(a){f&&sf(f);throw a;});return this.c(c)};h.signInWithRedirect=function(a){if(!Af())return H(new Q("operation-not-supported-in-this-environment"));var b=this,c=bj(this).then(function(){return hi(b.o,"signInViaRedirect",a)});return this.c(c)};
h.getRedirectResult=function(){if(!Af())return H(new Q("operation-not-supported-in-this-environment"));var a=this,b=bj(this).then(function(){return a.o.getRedirectResult()});return this.c(b)};
var cj=function(a,b){var c={};c.apiKey=X(a).options.apiKey;c.authDomain=X(a).options.authDomain;c.appName=X(a).name;return a.Eb.then(function(){return Qi(c,b,a.ab)}).then(function(b){if(Z(a)&&b.uid==Z(a).uid)return Z(a).copy(b),a.Ua(b);Yi(a,b);yi(b);return a.Ua(b)}).then(function(){a.Fa()})},Yi=function(a,b){Z(a)&&(wi(Z(a),a.Kd),Vb(Z(a),"tokenChanged",a.Ld),Vb(Z(a),"userDeleted",a.Jd));b&&(b.ic.push(a.Kd),Mb(b,"tokenChanged",a.Ld),Mb(b,"userDeleted",a.Jd));P(a,"currentUser",b)};
Y.prototype.signOut=function(){var a=this,b=this.va.then(function(){if(!Z(a))return G();Yi(a,null);return Wi(a.oa).then(function(){a.Fa()})});return this.c(b)};
var dj=function(a){var b=Si(a.ab,X(a).options.authDomain).then(function(b){if(a.Qc=b)b.Ia=a.ab;return Oi(a.ab)});return a.c(b)},Zi=function(a){var b=X(a).options.authDomain,c=dj(a).then(function(){return Xi(a.oa,b)}).then(function(b){return b?(b.Ia=a.ab,b.reload().then(function(){return Vi(a.oa,b).then(function(){return b})}).l(function(c){return"auth/network-request-failed"==c.code?b:Wi(a.oa)})):null}).then(function(b){Yi(a,b||null)});return a.c(c)},$i=function(a){return a.Eb.then(function(){return a.getRedirectResult()}).l(function(){}).then(function(){if(!a.Qa)return a.Bc()}).l(function(){}).then(function(){if(!a.Qa){a.Ec=
!0;var b=a.oa;b.B.addListener(Ui,b.D,a.Bc)}})};Y.prototype.Ue=function(){var a=this;return Xi(this.oa,X(this).options.authDomain).then(function(b){if(!a.Qa){var c;if(c=Z(a)&&b){c=Z(a).uid;var d=b.uid;c=void 0===c||null===c||""===c||void 0===d||null===d||""===d?!1:c==d}if(c)return Z(a).copy(b),Z(a).getToken();if(Z(a)||b)Yi(a,b),b&&(yi(b),b.Ia=a.ab),a.o&&a.o.subscribe(a),a.Fa()}})};Y.prototype.Ua=function(a){return Vi(this.oa,a)};Y.prototype.te=function(){this.Fa();this.Ua(Z(this))};
Y.prototype.se=function(){this.signOut()};var ej=function(a,b){return a.c(b.then(function(b){return cj(a,b)}).then(function(){return Z(a)}))};h=Y.prototype;h.xe=function(a){var b=this;this.addAuthTokenListener(function(){a.next(Z(b))})};h.onAuthStateChanged=function(a,b,c){var d=this;this.Ec&&firebase.Promise.resolve().then(function(){p(a)?a(Z(d)):p(a.next)&&a.next(Z(d))});return this.Je(a,b,c)};
h.getToken=function(a){var b=this,c=this.va.then(function(){return Z(b)?Z(b).getToken(a).then(function(a){return{accessToken:a}}):null});return this.c(c)};h.signInWithCustomToken=function(a){var b=this;return this.va.then(function(){return ej(b,R(b.f,Wg,{token:a}))}).then(function(a){Ei(a,"isAnonymous",!1);return b.Ua(a)}).then(function(){return Z(b)})};h.signInWithEmailAndPassword=function(a,b){var c=this;return this.va.then(function(){return ej(c,R(c.f,fg,{email:a,password:b}))})};
h.createUserWithEmailAndPassword=function(a,b){var c=this;return this.va.then(function(){return ej(c,R(c.f,Tg,{email:a,password:b}))})};h.signInWithCredential=function(a){var b=this;return this.va.then(function(){return ej(b,a.Kb(b.f))})};h.signInAnonymously=function(){var a=Z(this),b=this;return a&&a.isAnonymous?G(a):this.va.then(function(){return ej(b,b.f.signInAnonymously())}).then(function(a){Ei(a,"isAnonymous",!0);return b.Ua(a)}).then(function(){return Z(b)})};
var X=function(a){return a.app},Z=function(a){return a.currentUser};h=Y.prototype;h.Fa=function(){if(this.Ec)for(var a=0;a<this.Oa.length;a++)if(this.Oa[a])this.Oa[a](Z(this)&&Z(this)._lat||null)};h.addAuthTokenListener=function(a){var b=this;this.Oa.push(a);this.c(this.va.then(function(){b.Qa||Ka(b.Oa,a)&&a(Z(b)&&Z(b)._lat||null)}))};h.removeAuthTokenListener=function(a){Na(this.Oa,function(b){return b==a})};
h.delete=function(){this.Qa=!0;for(var a=0;a<this.Y.length;a++)this.Y[a].cancel("app-deleted");this.Y=[];this.oa&&(a=this.oa,a.B.removeListener(Ui,a.D,this.Bc));this.o&&this.o.unsubscribe(this);return firebase.Promise.resolve()};h.c=function(a){var b=this;this.Y.push(a);Bd(a,function(){Ma(b.Y,a)});return a};h.fetchProvidersForEmail=function(a){return this.c(Ag(this.f,a))};h.verifyPasswordResetCode=function(a){return this.checkActionCode(a).then(function(a){return a.data.email})};
h.confirmPasswordReset=function(a,b){return this.c(this.f.confirmPasswordReset(a,b).then(function(){}))};h.checkActionCode=function(a){return this.c(this.f.checkActionCode(a).then(function(a){return new Eh(a)}))};h.applyActionCode=function(a){return this.c(this.f.applyActionCode(a).then(function(){}))};h.sendPasswordResetEmail=function(a){return this.c(this.f.sendPasswordResetEmail(a).then(function(){}))};Mh(Y.prototype,{applyActionCode:{name:"applyActionCode",a:[T("code")]},checkActionCode:{name:"checkActionCode",a:[T("code")]},confirmPasswordReset:{name:"confirmPasswordReset",a:[T("code"),T("newPassword")]},createUserWithEmailAndPassword:{name:"createUserWithEmailAndPassword",a:[T("email"),T("password")]},fetchProvidersForEmail:{name:"fetchProvidersForEmail",a:[T("email")]},getRedirectResult:{name:"getRedirectResult",a:[]},onAuthStateChanged:{name:"onAuthStateChanged",a:[Kh(U(),Gh(),"nextOrObserver"),
Gh("opt_error",!0),Gh("opt_completed",!0)]},sendPasswordResetEmail:{name:"sendPasswordResetEmail",a:[T("email")]},signInAnonymously:{name:"signInAnonymously",a:[]},signInWithCredential:{name:"signInWithCredential",a:[Ih()]},signInWithCustomToken:{name:"signInWithCustomToken",a:[T("token")]},signInWithEmailAndPassword:{name:"signInWithEmailAndPassword",a:[T("email"),T("password")]},signInWithPopup:{name:"signInWithPopup",a:[Jh()]},signInWithRedirect:{name:"signInWithRedirect",a:[Jh()]},signOut:{name:"signOut",
a:[]},toJSON:{name:"toJSON",a:[T(null,!0)]},verifyPasswordResetCode:{name:"verifyPasswordResetCode",a:[T("code")]}});
Mh(W.prototype,{"delete":{name:"delete",a:[]},getToken:{name:"getToken",a:[{name:"opt_forceRefresh",fa:"a boolean",optional:!0,ga:function(a){return"boolean"==typeof a}}]},link:{name:"link",a:[Ih()]},linkWithPopup:{name:"linkWithPopup",a:[Jh()]},linkWithRedirect:{name:"linkWithRedirect",a:[Jh()]},reauthenticate:{name:"reauthenticate",a:[Ih()]},reload:{name:"reload",a:[]},sendEmailVerification:{name:"sendEmailVerification",a:[]},toJSON:{name:"toJSON",a:[T(null,!0)]},unlink:{name:"unlink",a:[T("provider")]},
updateEmail:{name:"updateEmail",a:[T("email")]},updatePassword:{name:"updatePassword",a:[T("password")]},updateProfile:{name:"updateProfile",a:[U("profile")]}});Mh(F.prototype,{l:{name:"catch"},then:{name:"then"}});V(hg,"credential",function(a,b){return new eg(a,b)},[T("email"),T("password")]);Mh(ag.prototype,{addScope:{name:"addScope",a:[T("scope")]},setCustomParameters:{name:"setCustomParameters",a:[U("customOAuthParameters")]}});V(ag,"credential",ag.credential,[Kh(T(),U(),"token")]);
Mh(bg.prototype,{addScope:{name:"addScope",a:[T("scope")]},setCustomParameters:{name:"setCustomParameters",a:[U("customOAuthParameters")]}});V(bg,"credential",bg.credential,[Kh(T(),U(),"token")]);Mh(cg.prototype,{addScope:{name:"addScope",a:[T("scope")]},setCustomParameters:{name:"setCustomParameters",a:[U("customOAuthParameters")]}});V(cg,"credential",cg.credential,[Kh(T(),Kh(U(),Hh()),"idToken"),Kh(T(),Hh(),"accessToken",!0)]);Mh(dg.prototype,{setCustomParameters:{name:"setCustomParameters",a:[U("customOAuthParameters")]}});
V(dg,"credential",dg.credential,[Kh(T(),U(),"token"),T("secret",!0)]);
(function(){if("undefined"!==typeof firebase&&firebase.INTERNAL&&firebase.INTERNAL.registerService){var a={Auth:Y,Error:Q};V(a,"EmailAuthProvider",hg,[]);V(a,"FacebookAuthProvider",ag,[]);V(a,"GithubAuthProvider",bg,[]);V(a,"GoogleAuthProvider",cg,[]);V(a,"TwitterAuthProvider",dg,[]);firebase.INTERNAL.registerService("auth",function(a,c){a=new Y(a);c({INTERNAL:{getToken:q(a.getToken,a),addAuthTokenListener:q(a.addAuthTokenListener,a),removeAuthTokenListener:q(a.removeAuthTokenListener,a)}});return a},
a,function(a,c){if("create"===a)try{c.auth()}catch(d){}});firebase.INTERNAL.extendNamespace({User:W})}else throw Error("Cannot find the firebase namespace; be sure to include firebase-app.js before this library.");})();})();
module.exports = firebase.auth;

},{"./app":4}],6:[function(require,module,exports){
var firebase = require('./app');
/*! @license Firebase v3.5.2
    Build: 3.5.2-rc.1
    Terms: https://developers.google.com/terms */
(function() {var g,n=this;function p(a){return void 0!==a}function aa(){}function ba(a){a.Wb=function(){return a.bf?a.bf:a.bf=new a}}
function ca(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b}function da(a){return"array"==ca(a)}function ea(a){var b=ca(a);return"array"==b||"object"==b&&"number"==typeof a.length}function q(a){return"string"==typeof a}function fa(a){return"number"==typeof a}function ga(a){return"function"==ca(a)}function ha(a){var b=typeof a;return"object"==b&&null!=a||"function"==b}function ia(a,b,c){return a.call.apply(a.bind,arguments)}
function ja(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function r(a,b,c){r=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?ia:ja;return r.apply(null,arguments)}
function ka(a,b){function c(){}c.prototype=b.prototype;a.Ig=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Eg=function(a,c,f){for(var h=Array(arguments.length-2),k=2;k<arguments.length;k++)h[k-2]=arguments[k];return b.prototype[c].apply(a,h)}};function la(){this.Ya=-1};function ma(){this.Ya=-1;this.Ya=64;this.N=[];this.Wd=[];this.Jf=[];this.zd=[];this.zd[0]=128;for(var a=1;a<this.Ya;++a)this.zd[a]=0;this.Pd=this.ac=0;this.reset()}ka(ma,la);ma.prototype.reset=function(){this.N[0]=1732584193;this.N[1]=4023233417;this.N[2]=2562383102;this.N[3]=271733878;this.N[4]=3285377520;this.Pd=this.ac=0};
function na(a,b,c){c||(c=0);var d=a.Jf;if(q(b))for(var e=0;16>e;e++)d[e]=b.charCodeAt(c)<<24|b.charCodeAt(c+1)<<16|b.charCodeAt(c+2)<<8|b.charCodeAt(c+3),c+=4;else for(e=0;16>e;e++)d[e]=b[c]<<24|b[c+1]<<16|b[c+2]<<8|b[c+3],c+=4;for(e=16;80>e;e++){var f=d[e-3]^d[e-8]^d[e-14]^d[e-16];d[e]=(f<<1|f>>>31)&4294967295}b=a.N[0];c=a.N[1];for(var h=a.N[2],k=a.N[3],m=a.N[4],l,e=0;80>e;e++)40>e?20>e?(f=k^c&(h^k),l=1518500249):(f=c^h^k,l=1859775393):60>e?(f=c&h|k&(c|h),l=2400959708):(f=c^h^k,l=3395469782),f=(b<<
5|b>>>27)+f+m+l+d[e]&4294967295,m=k,k=h,h=(c<<30|c>>>2)&4294967295,c=b,b=f;a.N[0]=a.N[0]+b&4294967295;a.N[1]=a.N[1]+c&4294967295;a.N[2]=a.N[2]+h&4294967295;a.N[3]=a.N[3]+k&4294967295;a.N[4]=a.N[4]+m&4294967295}
ma.prototype.update=function(a,b){if(null!=a){p(b)||(b=a.length);for(var c=b-this.Ya,d=0,e=this.Wd,f=this.ac;d<b;){if(0==f)for(;d<=c;)na(this,a,d),d+=this.Ya;if(q(a))for(;d<b;){if(e[f]=a.charCodeAt(d),++f,++d,f==this.Ya){na(this,e);f=0;break}}else for(;d<b;)if(e[f]=a[d],++f,++d,f==this.Ya){na(this,e);f=0;break}}this.ac=f;this.Pd+=b}};function t(a,b){for(var c in a)b.call(void 0,a[c],c,a)}function oa(a,b){var c={},d;for(d in a)c[d]=b.call(void 0,a[d],d,a);return c}function pa(a,b){for(var c in a)if(!b.call(void 0,a[c],c,a))return!1;return!0}function qa(a){var b=0,c;for(c in a)b++;return b}function ra(a){for(var b in a)return b}function sa(a){var b=[],c=0,d;for(d in a)b[c++]=a[d];return b}function ta(a){var b=[],c=0,d;for(d in a)b[c++]=d;return b}function ua(a,b){for(var c in a)if(a[c]==b)return!0;return!1}
function va(a,b,c){for(var d in a)if(b.call(c,a[d],d,a))return d}function wa(a,b){var c=va(a,b,void 0);return c&&a[c]}function xa(a){for(var b in a)return!1;return!0}function ya(a){var b={},c;for(c in a)b[c]=a[c];return b};function za(a){a=String(a);if(/^\s*$/.test(a)?0:/^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g,"@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g,"")))try{return eval("("+a+")")}catch(b){}throw Error("Invalid JSON string: "+a);}function Aa(){this.Fd=void 0}
function Ba(a,b,c){switch(typeof b){case "string":Ca(b,c);break;case "number":c.push(isFinite(b)&&!isNaN(b)?b:"null");break;case "boolean":c.push(b);break;case "undefined":c.push("null");break;case "object":if(null==b){c.push("null");break}if(da(b)){var d=b.length;c.push("[");for(var e="",f=0;f<d;f++)c.push(e),e=b[f],Ba(a,a.Fd?a.Fd.call(b,String(f),e):e,c),e=",";c.push("]");break}c.push("{");d="";for(f in b)Object.prototype.hasOwnProperty.call(b,f)&&(e=b[f],"function"!=typeof e&&(c.push(d),Ca(f,c),
c.push(":"),Ba(a,a.Fd?a.Fd.call(b,f,e):e,c),d=","));c.push("}");break;case "function":break;default:throw Error("Unknown type: "+typeof b);}}var Da={'"':'\\"',"\\":"\\\\","/":"\\/","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\x0B":"\\u000b"},Ea=/\uffff/.test("\uffff")?/[\\\"\x00-\x1f\x7f-\uffff]/g:/[\\\"\x00-\x1f\x7f-\xff]/g;
function Ca(a,b){b.push('"',a.replace(Ea,function(a){if(a in Da)return Da[a];var b=a.charCodeAt(0),e="\\u";16>b?e+="000":256>b?e+="00":4096>b&&(e+="0");return Da[a]=e+b.toString(16)}),'"')};var v;a:{var Fa=n.navigator;if(Fa){var Ga=Fa.userAgent;if(Ga){v=Ga;break a}}v=""};function Ha(a){if(Error.captureStackTrace)Error.captureStackTrace(this,Ha);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}ka(Ha,Error);Ha.prototype.name="CustomError";var w=Array.prototype,Ia=w.indexOf?function(a,b,c){return w.indexOf.call(a,b,c)}:function(a,b,c){c=null==c?0:0>c?Math.max(0,a.length+c):c;if(q(a))return q(b)&&1==b.length?a.indexOf(b,c):-1;for(;c<a.length;c++)if(c in a&&a[c]===b)return c;return-1},Ja=w.forEach?function(a,b,c){w.forEach.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=q(a)?a.split(""):a,f=0;f<d;f++)f in e&&b.call(c,e[f],f,a)},Ka=w.filter?function(a,b,c){return w.filter.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=[],f=0,h=q(a)?
a.split(""):a,k=0;k<d;k++)if(k in h){var m=h[k];b.call(c,m,k,a)&&(e[f++]=m)}return e},La=w.map?function(a,b,c){return w.map.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=Array(d),f=q(a)?a.split(""):a,h=0;h<d;h++)h in f&&(e[h]=b.call(c,f[h],h,a));return e},Ma=w.reduce?function(a,b,c,d){for(var e=[],f=1,h=arguments.length;f<h;f++)e.push(arguments[f]);d&&(e[0]=r(b,d));return w.reduce.apply(a,e)}:function(a,b,c,d){var e=c;Ja(a,function(c,h){e=b.call(d,e,c,h,a)});return e},Na=w.every?function(a,b,
c){return w.every.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=q(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&!b.call(c,e[f],f,a))return!1;return!0};function Oa(a,b){var c=Pa(a,b,void 0);return 0>c?null:q(a)?a.charAt(c):a[c]}function Pa(a,b,c){for(var d=a.length,e=q(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&b.call(c,e[f],f,a))return f;return-1}function Qa(a,b){var c=Ia(a,b);0<=c&&w.splice.call(a,c,1)}function Ra(a,b,c){return 2>=arguments.length?w.slice.call(a,b):w.slice.call(a,b,c)}
function Sa(a,b){a.sort(b||Ta)}function Ta(a,b){return a>b?1:a<b?-1:0};var Ua=-1!=v.indexOf("Opera")||-1!=v.indexOf("OPR"),Va=-1!=v.indexOf("Trident")||-1!=v.indexOf("MSIE"),Wa=-1!=v.indexOf("Gecko")&&-1==v.toLowerCase().indexOf("webkit")&&!(-1!=v.indexOf("Trident")||-1!=v.indexOf("MSIE")),Xa=-1!=v.toLowerCase().indexOf("webkit");
(function(){var a="",b;if(Ua&&n.opera)return a=n.opera.version,ga(a)?a():a;Wa?b=/rv\:([^\);]+)(\)|;)/:Va?b=/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/:Xa&&(b=/WebKit\/(\S+)/);b&&(a=(a=b.exec(v))?a[1]:"");return Va&&(b=(b=n.document)?b.documentMode:void 0,b>parseFloat(a))?String(b):a})();var Ya=null,Za=null,$a=null;function ab(a,b){if(!ea(a))throw Error("encodeByteArray takes an array as a parameter");bb();for(var c=b?Za:Ya,d=[],e=0;e<a.length;e+=3){var f=a[e],h=e+1<a.length,k=h?a[e+1]:0,m=e+2<a.length,l=m?a[e+2]:0,u=f>>2,f=(f&3)<<4|k>>4,k=(k&15)<<2|l>>6,l=l&63;m||(l=64,h||(k=64));d.push(c[u],c[f],c[k],c[l])}return d.join("")}
function bb(){if(!Ya){Ya={};Za={};$a={};for(var a=0;65>a;a++)Ya[a]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(a),Za[a]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(a),$a[Za[a]]=a,62<=a&&($a["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(a)]=a)}};function cb(a){n.setTimeout(function(){throw a;},0)}var db;
function eb(){var a=n.MessageChannel;"undefined"===typeof a&&"undefined"!==typeof window&&window.postMessage&&window.addEventListener&&-1==v.indexOf("Presto")&&(a=function(){var a=document.createElement("iframe");a.style.display="none";a.src="";document.documentElement.appendChild(a);var b=a.contentWindow,a=b.document;a.open();a.write("");a.close();var c="callImmediate"+Math.random(),d="file:"==b.location.protocol?"*":b.location.protocol+"//"+b.location.host,a=r(function(a){if(("*"==d||a.origin==
d)&&a.data==c)this.port1.onmessage()},this);b.addEventListener("message",a,!1);this.port1={};this.port2={postMessage:function(){b.postMessage(c,d)}}});if("undefined"!==typeof a&&-1==v.indexOf("Trident")&&-1==v.indexOf("MSIE")){var b=new a,c={},d=c;b.port1.onmessage=function(){if(p(c.next)){c=c.next;var a=c.Le;c.Le=null;a()}};return function(a){d.next={Le:a};d=d.next;b.port2.postMessage(0)}}return"undefined"!==typeof document&&"onreadystatechange"in document.createElement("script")?function(a){var b=
document.createElement("script");b.onreadystatechange=function(){b.onreadystatechange=null;b.parentNode.removeChild(b);b=null;a();a=null};document.documentElement.appendChild(b)}:function(a){n.setTimeout(a,0)}};function fb(a,b){gb||hb();ib||(gb(),ib=!0);jb.push(new kb(a,b))}var gb;function hb(){if(n.Promise&&n.Promise.resolve){var a=n.Promise.resolve();gb=function(){a.then(lb)}}else gb=function(){var a=lb;!ga(n.setImmediate)||n.Window&&n.Window.prototype&&n.Window.prototype.setImmediate==n.setImmediate?(db||(db=eb()),db(a)):n.setImmediate(a)}}var ib=!1,jb=[];[].push(function(){ib=!1;jb=[]});
function lb(){for(;jb.length;){var a=jb;jb=[];for(var b=0;b<a.length;b++){var c=a[b];try{c.Wf.call(c.scope)}catch(d){cb(d)}}}ib=!1}function kb(a,b){this.Wf=a;this.scope=b};function mb(a,b){this.L=nb;this.uf=void 0;this.Ca=this.Ha=null;this.jd=this.be=!1;if(a==ob)pb(this,qb,b);else try{var c=this;a.call(b,function(a){pb(c,qb,a)},function(a){if(!(a instanceof rb))try{if(a instanceof Error)throw a;throw Error("Promise rejected.");}catch(b){}pb(c,sb,a)})}catch(d){pb(this,sb,d)}}var nb=0,qb=2,sb=3;function ob(){}mb.prototype.then=function(a,b,c){return tb(this,ga(a)?a:null,ga(b)?b:null,c)};mb.prototype.then=mb.prototype.then;mb.prototype.$goog_Thenable=!0;g=mb.prototype;
g.Ag=function(a,b){return tb(this,null,a,b)};g.cancel=function(a){this.L==nb&&fb(function(){var b=new rb(a);ub(this,b)},this)};function ub(a,b){if(a.L==nb)if(a.Ha){var c=a.Ha;if(c.Ca){for(var d=0,e=-1,f=0,h;h=c.Ca[f];f++)if(h=h.k)if(d++,h==a&&(e=f),0<=e&&1<d)break;0<=e&&(c.L==nb&&1==d?ub(c,b):(d=c.Ca.splice(e,1)[0],vb(c,d,sb,b)))}a.Ha=null}else pb(a,sb,b)}function wb(a,b){a.Ca&&a.Ca.length||a.L!=qb&&a.L!=sb||xb(a);a.Ca||(a.Ca=[]);a.Ca.push(b)}
function tb(a,b,c,d){var e={k:null,hf:null,kf:null};e.k=new mb(function(a,h){e.hf=b?function(c){try{var e=b.call(d,c);a(e)}catch(l){h(l)}}:a;e.kf=c?function(b){try{var e=c.call(d,b);!p(e)&&b instanceof rb?h(b):a(e)}catch(l){h(l)}}:h});e.k.Ha=a;wb(a,e);return e.k}g.Cf=function(a){this.L=nb;pb(this,qb,a)};g.Df=function(a){this.L=nb;pb(this,sb,a)};
function pb(a,b,c){if(a.L==nb){if(a==c)b=sb,c=new TypeError("Promise cannot resolve to itself");else{var d;if(c)try{d=!!c.$goog_Thenable}catch(e){d=!1}else d=!1;if(d){a.L=1;c.then(a.Cf,a.Df,a);return}if(ha(c))try{var f=c.then;if(ga(f)){yb(a,c,f);return}}catch(h){b=sb,c=h}}a.uf=c;a.L=b;a.Ha=null;xb(a);b!=sb||c instanceof rb||zb(a,c)}}function yb(a,b,c){function d(b){f||(f=!0,a.Df(b))}function e(b){f||(f=!0,a.Cf(b))}a.L=1;var f=!1;try{c.call(b,e,d)}catch(h){d(h)}}
function xb(a){a.be||(a.be=!0,fb(a.Uf,a))}g.Uf=function(){for(;this.Ca&&this.Ca.length;){var a=this.Ca;this.Ca=null;for(var b=0;b<a.length;b++)vb(this,a[b],this.L,this.uf)}this.be=!1};function vb(a,b,c,d){if(c==qb)b.hf(d);else{if(b.k)for(;a&&a.jd;a=a.Ha)a.jd=!1;b.kf(d)}}function zb(a,b){a.jd=!0;fb(function(){a.jd&&Ab.call(null,b)})}var Ab=cb;function rb(a){Ha.call(this,a)}ka(rb,Ha);rb.prototype.name="cancel";function Bb(a,b){return Object.prototype.hasOwnProperty.call(a,b)}function x(a,b){if(Object.prototype.hasOwnProperty.call(a,b))return a[b]}function Cb(a,b){for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&b(c,a[c])};function y(a,b,c,d){var e;d<b?e="at least "+b:d>c&&(e=0===c?"none":"no more than "+c);if(e)throw Error(a+" failed: Was called with "+d+(1===d?" argument.":" arguments.")+" Expects "+e+".");}function Db(a,b,c){var d="";switch(b){case 1:d=c?"first":"First";break;case 2:d=c?"second":"Second";break;case 3:d=c?"third":"Third";break;case 4:d=c?"fourth":"Fourth";break;default:throw Error("errorPrefix called with argumentNumber > 4.  Need to update it?");}return a=a+" failed: "+(d+" argument ")}
function A(a,b,c,d){if((!d||p(c))&&!ga(c))throw Error(Db(a,b,d)+"must be a valid function.");}function Eb(a,b,c){if(p(c)&&(!ha(c)||null===c))throw Error(Db(a,b,!0)+"must be a valid context object.");};function Fb(a){var b=[];Cb(a,function(a,d){da(d)?Ja(d,function(d){b.push(encodeURIComponent(a)+"="+encodeURIComponent(d))}):b.push(encodeURIComponent(a)+"="+encodeURIComponent(d))});return b.length?"&"+b.join("&"):""};var Gb=n.Promise||mb;mb.prototype["catch"]=mb.prototype.Ag;function Hb(){var a=this;this.reject=this.resolve=null;this.sa=new Gb(function(b,c){a.resolve=b;a.reject=c})}function Ib(a,b){return function(c,d){c?a.reject(c):a.resolve(d);ga(b)&&(Jb(a.sa),1===b.length?b(c):b(c,d))}}function Jb(a){a.then(void 0,aa)};function Kb(a,b){if(!a)throw Lb(b);}function Lb(a){return Error("Firebase Database ("+firebase.SDK_VERSION+") INTERNAL ASSERT FAILED: "+a)};function Mb(a){for(var b=[],c=0,d=0;d<a.length;d++){var e=a.charCodeAt(d);55296<=e&&56319>=e&&(e-=55296,d++,Kb(d<a.length,"Surrogate pair missing trail surrogate."),e=65536+(e<<10)+(a.charCodeAt(d)-56320));128>e?b[c++]=e:(2048>e?b[c++]=e>>6|192:(65536>e?b[c++]=e>>12|224:(b[c++]=e>>18|240,b[c++]=e>>12&63|128),b[c++]=e>>6&63|128),b[c++]=e&63|128)}return b}function Nb(a){for(var b=0,c=0;c<a.length;c++){var d=a.charCodeAt(c);128>d?b++:2048>d?b+=2:55296<=d&&56319>=d?(b+=4,c++):b+=3}return b};function Ob(a){return"undefined"!==typeof JSON&&p(JSON.parse)?JSON.parse(a):za(a)}function B(a){if("undefined"!==typeof JSON&&p(JSON.stringify))a=JSON.stringify(a);else{var b=[];Ba(new Aa,a,b);a=b.join("")}return a};function Pb(a,b){this.committed=a;this.snapshot=b};function Qb(){return"undefined"!==typeof window&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test("undefined"!==typeof navigator&&"string"===typeof navigator.userAgent?navigator.userAgent:"")};function Rb(a){this.te=a;this.Bd=[];this.Rb=0;this.Yd=-1;this.Gb=null}function Sb(a,b,c){a.Yd=b;a.Gb=c;a.Yd<a.Rb&&(a.Gb(),a.Gb=null)}function Tb(a,b,c){for(a.Bd[b]=c;a.Bd[a.Rb];){var d=a.Bd[a.Rb];delete a.Bd[a.Rb];for(var e=0;e<d.length;++e)if(d[e]){var f=a;Ub(function(){f.te(d[e])})}if(a.Rb===a.Yd){a.Gb&&(clearTimeout(a.Gb),a.Gb(),a.Gb=null);break}a.Rb++}};function Vb(){this.qc={}}Vb.prototype.set=function(a,b){null==b?delete this.qc[a]:this.qc[a]=b};Vb.prototype.get=function(a){return Bb(this.qc,a)?this.qc[a]:null};Vb.prototype.remove=function(a){delete this.qc[a]};Vb.prototype.cf=!0;function Wb(a){this.vc=a;this.Cd="firebase:"}g=Wb.prototype;g.set=function(a,b){null==b?this.vc.removeItem(this.Cd+a):this.vc.setItem(this.Cd+a,B(b))};g.get=function(a){a=this.vc.getItem(this.Cd+a);return null==a?null:Ob(a)};g.remove=function(a){this.vc.removeItem(this.Cd+a)};g.cf=!1;g.toString=function(){return this.vc.toString()};function Xb(a){try{if("undefined"!==typeof window&&"undefined"!==typeof window[a]){var b=window[a];b.setItem("firebase:sentinel","cache");b.removeItem("firebase:sentinel");return new Wb(b)}}catch(c){}return new Vb}var Yb=Xb("localStorage"),Zb=Xb("sessionStorage");function $b(a,b,c){this.type=ac;this.source=a;this.path=b;this.Ja=c}$b.prototype.Nc=function(a){return this.path.e()?new $b(this.source,C,this.Ja.R(a)):new $b(this.source,D(this.path),this.Ja)};$b.prototype.toString=function(){return"Operation("+this.path+": "+this.source.toString()+" overwrite: "+this.Ja.toString()+")"};function bc(a,b){this.type=cc;this.source=a;this.path=b}bc.prototype.Nc=function(){return this.path.e()?new bc(this.source,C):new bc(this.source,D(this.path))};bc.prototype.toString=function(){return"Operation("+this.path+": "+this.source.toString()+" listen_complete)"};function dc(a){this.He=a}dc.prototype.getToken=function(a){return this.He.INTERNAL.getToken(a).then(null,function(a){return a&&"auth/token-not-initialized"===a.code?(E("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(a)})};function ec(a,b){a.He.INTERNAL.addAuthTokenListener(b)};function fc(){this.Jd=F}fc.prototype.j=function(a){return this.Jd.Q(a)};fc.prototype.toString=function(){return this.Jd.toString()};function gc(a,b,c,d,e){this.host=a.toLowerCase();this.domain=this.host.substr(this.host.indexOf(".")+1);this.Sc=b;this.pe=c;this.Cg=d;this.nf=e||"";this.bb=Yb.get("host:"+a)||this.host}function hc(a,b){b!==a.bb&&(a.bb=b,"s-"===a.bb.substr(0,2)&&Yb.set("host:"+a.host,a.bb))}
function ic(a,b,c){H("string"===typeof b,"typeof type must == string");H("object"===typeof c,"typeof params must == object");if("websocket"===b)b=(a.Sc?"wss://":"ws://")+a.bb+"/.ws?";else if("long_polling"===b)b=(a.Sc?"https://":"http://")+a.bb+"/.lp?";else throw Error("Unknown connection type: "+b);a.host!==a.bb&&(c.ns=a.pe);var d=[];t(c,function(a,b){d.push(b+"="+a)});return b+d.join("&")}
gc.prototype.toString=function(){var a=(this.Sc?"https://":"http://")+this.host;this.nf&&(a+="<"+this.nf+">");return a};function jc(){this.uc={}}function kc(a,b,c){p(c)||(c=1);Bb(a.uc,b)||(a.uc[b]=0);a.uc[b]+=c}jc.prototype.get=function(){return ya(this.uc)};function lc(a){this.Nf=a;this.rd=null}lc.prototype.get=function(){var a=this.Nf.get(),b=ya(a);if(this.rd)for(var c in this.rd)b[c]-=this.rd[c];this.rd=a;return b};function mc(){this.wb=[]}function nc(a,b){for(var c=null,d=0;d<b.length;d++){var e=b[d],f=e.Zb();null===c||f.$(c.Zb())||(a.wb.push(c),c=null);null===c&&(c=new oc(f));c.add(e)}c&&a.wb.push(c)}function pc(a,b,c){nc(a,c);qc(a,function(a){return a.$(b)})}function rc(a,b,c){nc(a,c);qc(a,function(a){return a.contains(b)||b.contains(a)})}
function qc(a,b){for(var c=!0,d=0;d<a.wb.length;d++){var e=a.wb[d];if(e)if(e=e.Zb(),b(e)){for(var e=a.wb[d],f=0;f<e.hd.length;f++){var h=e.hd[f];if(null!==h){e.hd[f]=null;var k=h.Ub();sc&&E("event: "+h.toString());Ub(k)}}a.wb[d]=null}else c=!1}c&&(a.wb=[])}function oc(a){this.ra=a;this.hd=[]}oc.prototype.add=function(a){this.hd.push(a)};oc.prototype.Zb=function(){return this.ra};function tc(a,b,c,d){this.ae=b;this.Md=c;this.Dd=d;this.gd=a}tc.prototype.Zb=function(){var a=this.Md.xb();return"value"===this.gd?a.path:a.getParent().path};tc.prototype.ge=function(){return this.gd};tc.prototype.Ub=function(){return this.ae.Ub(this)};tc.prototype.toString=function(){return this.Zb().toString()+":"+this.gd+":"+B(this.Md.Ue())};function uc(a,b,c){this.ae=a;this.error=b;this.path=c}uc.prototype.Zb=function(){return this.path};uc.prototype.ge=function(){return"cancel"};
uc.prototype.Ub=function(){return this.ae.Ub(this)};uc.prototype.toString=function(){return this.path.toString()+":cancel"};function vc(){}vc.prototype.Xe=function(){return null};vc.prototype.fe=function(){return null};var wc=new vc;function xc(a,b,c){this.Gf=a;this.Na=b;this.yd=c}xc.prototype.Xe=function(a){var b=this.Na.O;if(yc(b,a))return b.j().R(a);b=null!=this.yd?new zc(this.yd,!0,!1):this.Na.w();return this.Gf.rc(a,b)};xc.prototype.fe=function(a,b,c){var d=null!=this.yd?this.yd:Ac(this.Na);a=this.Gf.Xd(d,b,1,c,a);return 0===a.length?null:a[0]};function I(a,b,c,d){this.type=a;this.Ma=b;this.Za=c;this.qe=d;this.Dd=void 0}function Bc(a){return new I(Cc,a)}var Cc="value";function zc(a,b,c){this.A=a;this.ea=b;this.Tb=c}function Dc(a){return a.ea}function Ec(a){return a.Tb}function Fc(a,b){return b.e()?a.ea&&!a.Tb:yc(a,J(b))}function yc(a,b){return a.ea&&!a.Tb||a.A.Fa(b)}zc.prototype.j=function(){return this.A};function Gc(a,b){return Hc(a.name,b.name)}function Ic(a,b){return Hc(a,b)};function K(a,b){this.name=a;this.S=b}function Jc(a,b){return new K(a,b)};function Kc(a,b){return a&&"object"===typeof a?(H(".sv"in a,"Unexpected leaf node or priority contents"),b[a[".sv"]]):a}function Lc(a,b){var c=new Mc;Nc(a,new L(""),function(a,e){Oc(c,a,Pc(e,b))});return c}function Pc(a,b){var c=a.C().H(),c=Kc(c,b),d;if(a.J()){var e=Kc(a.Ea(),b);return e!==a.Ea()||c!==a.C().H()?new Qc(e,M(c)):a}d=a;c!==a.C().H()&&(d=d.ga(new Qc(c)));a.P(N,function(a,c){var e=Pc(c,b);e!==c&&(d=d.U(a,e))});return d};var Rc=function(){var a=1;return function(){return a++}}(),H=Kb,Sc=Lb;
function Tc(a){try{var b;bb();for(var c=$a,d=[],e=0;e<a.length;){var f=c[a.charAt(e++)],h=e<a.length?c[a.charAt(e)]:0;++e;var k=e<a.length?c[a.charAt(e)]:64;++e;var m=e<a.length?c[a.charAt(e)]:64;++e;if(null==f||null==h||null==k||null==m)throw Error();d.push(f<<2|h>>4);64!=k&&(d.push(h<<4&240|k>>2),64!=m&&d.push(k<<6&192|m))}if(8192>d.length)b=String.fromCharCode.apply(null,d);else{a="";for(c=0;c<d.length;c+=8192)a+=String.fromCharCode.apply(null,Ra(d,c,c+8192));b=a}return b}catch(l){E("base64Decode failed: ",
l)}return null}function Uc(a){var b=Mb(a);a=new ma;a.update(b);var b=[],c=8*a.Pd;56>a.ac?a.update(a.zd,56-a.ac):a.update(a.zd,a.Ya-(a.ac-56));for(var d=a.Ya-1;56<=d;d--)a.Wd[d]=c&255,c/=256;na(a,a.Wd);for(d=c=0;5>d;d++)for(var e=24;0<=e;e-=8)b[c]=a.N[d]>>e&255,++c;return ab(b)}function Vc(a){for(var b="",c=0;c<arguments.length;c++)b=ea(arguments[c])?b+Vc.apply(null,arguments[c]):"object"===typeof arguments[c]?b+B(arguments[c]):b+arguments[c],b+=" ";return b}var sc=null,Wc=!0;
function Xc(a,b){Kb(!b||!0===a||!1===a,"Can't turn on custom loggers persistently.");!0===a?("undefined"!==typeof console&&("function"===typeof console.log?sc=r(console.log,console):"object"===typeof console.log&&(sc=function(a){console.log(a)})),b&&Zb.set("logging_enabled",!0)):ga(a)?sc=a:(sc=null,Zb.remove("logging_enabled"))}function E(a){!0===Wc&&(Wc=!1,null===sc&&!0===Zb.get("logging_enabled")&&Xc(!0));if(sc){var b=Vc.apply(null,arguments);sc(b)}}
function Yc(a){return function(){E(a,arguments)}}function Zc(a){if("undefined"!==typeof console){var b="FIREBASE INTERNAL ERROR: "+Vc.apply(null,arguments);"undefined"!==typeof console.error?console.error(b):console.log(b)}}function $c(a){var b=Vc.apply(null,arguments);throw Error("FIREBASE FATAL ERROR: "+b);}function O(a){if("undefined"!==typeof console){var b="FIREBASE WARNING: "+Vc.apply(null,arguments);"undefined"!==typeof console.warn?console.warn(b):console.log(b)}}
function ad(a){var b,c,d,e,f,h=a;f=c=a=b="";d=!0;e="https";if(q(h)){var k=h.indexOf("//");0<=k&&(e=h.substring(0,k-1),h=h.substring(k+2));k=h.indexOf("/");-1===k&&(k=h.length);b=h.substring(0,k);f="";h=h.substring(k).split("/");for(k=0;k<h.length;k++)if(0<h[k].length){var m=h[k];try{m=decodeURIComponent(m.replace(/\+/g," "))}catch(l){}f+="/"+m}h=b.split(".");3===h.length?(a=h[1],c=h[0].toLowerCase()):2===h.length&&(a=h[0]);k=b.indexOf(":");0<=k&&(d="https"===e||"wss"===e)}"firebase"===a&&$c(b+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead");
c&&"undefined"!=c||$c("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com");d||"undefined"!==typeof window&&window.location&&window.location.protocol&&-1!==window.location.protocol.indexOf("https:")&&O("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().");return{kc:new gc(b,d,c,"ws"===e||"wss"===e),path:new L(f)}}function bd(a){return fa(a)&&(a!=a||a==Number.POSITIVE_INFINITY||a==Number.NEGATIVE_INFINITY)}
function cd(a){if("complete"===document.readyState)a();else{var b=!1,c=function(){document.body?b||(b=!0,a()):setTimeout(c,Math.floor(10))};document.addEventListener?(document.addEventListener("DOMContentLoaded",c,!1),window.addEventListener("load",c,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",function(){"complete"===document.readyState&&c()}),window.attachEvent("onload",c))}}
function Hc(a,b){if(a===b)return 0;if("[MIN_NAME]"===a||"[MAX_NAME]"===b)return-1;if("[MIN_NAME]"===b||"[MAX_NAME]"===a)return 1;var c=dd(a),d=dd(b);return null!==c?null!==d?0==c-d?a.length-b.length:c-d:-1:null!==d?1:a<b?-1:1}function ed(a,b){if(b&&a in b)return b[a];throw Error("Missing required key ("+a+") in object: "+B(b));}
function fd(a){if("object"!==typeof a||null===a)return B(a);var b=[],c;for(c in a)b.push(c);b.sort();c="{";for(var d=0;d<b.length;d++)0!==d&&(c+=","),c+=B(b[d]),c+=":",c+=fd(a[b[d]]);return c+"}"}function gd(a,b){if(a.length<=b)return[a];for(var c=[],d=0;d<a.length;d+=b)d+b>a?c.push(a.substring(d,a.length)):c.push(a.substring(d,d+b));return c}function hd(a,b){if(da(a))for(var c=0;c<a.length;++c)b(c,a[c]);else t(a,b)}
function id(a){H(!bd(a),"Invalid JSON number");var b,c,d,e;0===a?(d=c=0,b=-Infinity===1/a?1:0):(b=0>a,a=Math.abs(a),a>=Math.pow(2,-1022)?(d=Math.min(Math.floor(Math.log(a)/Math.LN2),1023),c=d+1023,d=Math.round(a*Math.pow(2,52-d)-Math.pow(2,52))):(c=0,d=Math.round(a/Math.pow(2,-1074))));e=[];for(a=52;a;--a)e.push(d%2?1:0),d=Math.floor(d/2);for(a=11;a;--a)e.push(c%2?1:0),c=Math.floor(c/2);e.push(b?1:0);e.reverse();b=e.join("");c="";for(a=0;64>a;a+=8)d=parseInt(b.substr(a,8),2).toString(16),1===d.length&&
(d="0"+d),c+=d;return c.toLowerCase()}var jd=/^-?\d{1,10}$/;function dd(a){return jd.test(a)&&(a=Number(a),-2147483648<=a&&2147483647>=a)?a:null}function Ub(a){try{a()}catch(b){setTimeout(function(){O("Exception was thrown by user callback.",b.stack||"");throw b;},Math.floor(0))}}function kd(a,b,c){Object.defineProperty(a,b,{get:c})}function ld(a,b){var c=setTimeout(a,b);"object"===typeof c&&c.unref&&c.unref();return c};function md(a){var b={},c={},d={},e="";try{var f=a.split("."),b=Ob(Tc(f[0])||""),c=Ob(Tc(f[1])||""),e=f[2],d=c.d||{};delete c.d}catch(h){}return{Fg:b,Me:c,data:d,xg:e}}function nd(a){a=md(a);var b=a.Me;return!!a.xg&&!!b&&"object"===typeof b&&b.hasOwnProperty("iat")}function od(a){a=md(a).Me;return"object"===typeof a&&!0===x(a,"admin")};function pd(a,b,c){this.f=Yc("p:rest:");this.M=a;this.Hb=b;this.Vd=c;this.aa={}}function qd(a,b){if(p(b))return"tag$"+b;H(rd(a.n),"should have a tag if it's not a default query.");return a.path.toString()}g=pd.prototype;
g.df=function(a,b,c,d){var e=a.path.toString();this.f("Listen called for "+e+" "+a.ka());var f=qd(a,c),h={};this.aa[f]=h;a=sd(a.n);var k=this;td(this,e+".json",a,function(a,b){var u=b;404===a&&(a=u=null);null===a&&k.Hb(e,u,!1,c);x(k.aa,f)===h&&d(a?401==a?"permission_denied":"rest_error:"+a:"ok",null)})};g.Ef=function(a,b){var c=qd(a,b);delete this.aa[c]};g.qf=function(){};g.re=function(){};g.gf=function(){};g.xd=function(){};g.put=function(){};g.ef=function(){};g.ye=function(){};
function td(a,b,c,d){c=c||{};c.format="export";a.Vd.getToken(!1).then(function(e){(e=e&&e.accessToken)&&(c.auth=e);var f=(a.M.Sc?"https://":"http://")+a.M.host+b+"?"+Fb(c);a.f("Sending REST request for "+f);var h=new XMLHttpRequest;h.onreadystatechange=function(){if(d&&4===h.readyState){a.f("REST Response for "+f+" received. status:",h.status,"response:",h.responseText);var b=null;if(200<=h.status&&300>h.status){try{b=Ob(h.responseText)}catch(c){O("Failed to parse JSON response for "+f+": "+h.responseText)}d(null,
b)}else 401!==h.status&&404!==h.status&&O("Got unsuccessful REST response for "+f+" Status: "+h.status),d(h.status);d=null}};h.open("GET",f,!0);h.send()})};function vd(a,b,c){this.type=wd;this.source=a;this.path=b;this.children=c}vd.prototype.Nc=function(a){if(this.path.e())return a=this.children.subtree(new L(a)),a.e()?null:a.value?new $b(this.source,C,a.value):new vd(this.source,C,a);H(J(this.path)===a,"Can't get a merge for a child not on the path of the operation");return new vd(this.source,D(this.path),this.children)};vd.prototype.toString=function(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"};function xd(a,b){this.zf={};this.Vc=new lc(a);this.wa=b;var c=1E4+2E4*Math.random();ld(r(this.rf,this),Math.floor(c))}xd.prototype.rf=function(){var a=this.Vc.get(),b={},c=!1,d;for(d in a)0<a[d]&&Bb(this.zf,d)&&(b[d]=a[d],c=!0);c&&this.wa.ye(b);ld(r(this.rf,this),Math.floor(6E5*Math.random()))};var yd={},zd={};function Ad(a){a=a.toString();yd[a]||(yd[a]=new jc);return yd[a]}function Bd(a,b){var c=a.toString();zd[c]||(zd[c]=b());return zd[c]};var Cd=null;"undefined"!==typeof MozWebSocket?Cd=MozWebSocket:"undefined"!==typeof WebSocket&&(Cd=WebSocket);function Dd(a,b,c,d){this.Zd=a;this.f=Yc(this.Zd);this.frames=this.Ac=null;this.qb=this.rb=this.Fe=0;this.Xa=Ad(b);a={v:"5"};"undefined"!==typeof location&&location.href&&-1!==location.href.indexOf("firebaseio.com")&&(a.r="f");c&&(a.s=c);d&&(a.ls=d);this.Ne=ic(b,"websocket",a)}var Ed;
Dd.prototype.open=function(a,b){this.kb=b;this.hg=a;this.f("Websocket connecting to "+this.Ne);this.xc=!1;Yb.set("previous_websocket_failure",!0);try{this.La=new Cd(this.Ne)}catch(c){this.f("Error instantiating WebSocket.");var d=c.message||c.data;d&&this.f(d);this.fb();return}var e=this;this.La.onopen=function(){e.f("Websocket connected.");e.xc=!0};this.La.onclose=function(){e.f("Websocket connection was disconnected.");e.La=null;e.fb()};this.La.onmessage=function(a){if(null!==e.La)if(a=a.data,e.qb+=
a.length,kc(e.Xa,"bytes_received",a.length),Fd(e),null!==e.frames)Gd(e,a);else{a:{H(null===e.frames,"We already have a frame buffer");if(6>=a.length){var b=Number(a);if(!isNaN(b)){e.Fe=b;e.frames=[];a=null;break a}}e.Fe=1;e.frames=[]}null!==a&&Gd(e,a)}};this.La.onerror=function(a){e.f("WebSocket error.  Closing connection.");(a=a.message||a.data)&&e.f(a);e.fb()}};Dd.prototype.start=function(){};
Dd.isAvailable=function(){var a=!1;if("undefined"!==typeof navigator&&navigator.userAgent){var b=navigator.userAgent.match(/Android ([0-9]{0,}\.[0-9]{0,})/);b&&1<b.length&&4.4>parseFloat(b[1])&&(a=!0)}return!a&&null!==Cd&&!Ed};Dd.responsesRequiredToBeHealthy=2;Dd.healthyTimeout=3E4;g=Dd.prototype;g.sd=function(){Yb.remove("previous_websocket_failure")};function Gd(a,b){a.frames.push(b);if(a.frames.length==a.Fe){var c=a.frames.join("");a.frames=null;c=Ob(c);a.hg(c)}}
g.send=function(a){Fd(this);a=B(a);this.rb+=a.length;kc(this.Xa,"bytes_sent",a.length);a=gd(a,16384);1<a.length&&Hd(this,String(a.length));for(var b=0;b<a.length;b++)Hd(this,a[b])};g.Tc=function(){this.Bb=!0;this.Ac&&(clearInterval(this.Ac),this.Ac=null);this.La&&(this.La.close(),this.La=null)};g.fb=function(){this.Bb||(this.f("WebSocket is closing itself"),this.Tc(),this.kb&&(this.kb(this.xc),this.kb=null))};g.close=function(){this.Bb||(this.f("WebSocket is being closed"),this.Tc())};
function Fd(a){clearInterval(a.Ac);a.Ac=setInterval(function(){a.La&&Hd(a,"0");Fd(a)},Math.floor(45E3))}function Hd(a,b){try{a.La.send(b)}catch(c){a.f("Exception thrown from WebSocket.send():",c.message||c.data,"Closing connection."),setTimeout(r(a.fb,a),0)}};function Id(){this.hb={}}
function Jd(a,b){var c=b.type,d=b.Za;H("child_added"==c||"child_changed"==c||"child_removed"==c,"Only child changes supported for tracking");H(".priority"!==d,"Only non-priority child changes can be tracked.");var e=x(a.hb,d);if(e){var f=e.type;if("child_added"==c&&"child_removed"==f)a.hb[d]=new I("child_changed",b.Ma,d,e.Ma);else if("child_removed"==c&&"child_added"==f)delete a.hb[d];else if("child_removed"==c&&"child_changed"==f)a.hb[d]=new I("child_removed",e.qe,d);else if("child_changed"==c&&
"child_added"==f)a.hb[d]=new I("child_added",b.Ma,d);else if("child_changed"==c&&"child_changed"==f)a.hb[d]=new I("child_changed",b.Ma,d,e.qe);else throw Sc("Illegal combination of changes: "+b+" occurred after "+e);}else a.hb[d]=b};function Kd(a){this.W=a;this.g=a.n.g}function Ld(a,b,c,d){var e=[],f=[];Ja(b,function(b){"child_changed"===b.type&&a.g.nd(b.qe,b.Ma)&&f.push(new I("child_moved",b.Ma,b.Za))});Md(a,e,"child_removed",b,d,c);Md(a,e,"child_added",b,d,c);Md(a,e,"child_moved",f,d,c);Md(a,e,"child_changed",b,d,c);Md(a,e,Cc,b,d,c);return e}function Md(a,b,c,d,e,f){d=Ka(d,function(a){return a.type===c});Sa(d,r(a.Of,a));Ja(d,function(c){var d=Nd(a,c,f);Ja(e,function(e){e.tf(c.type)&&b.push(e.createEvent(d,a.W))})})}
function Nd(a,b,c){"value"!==b.type&&"child_removed"!==b.type&&(b.Dd=c.Ze(b.Za,b.Ma,a.g));return b}Kd.prototype.Of=function(a,b){if(null==a.Za||null==b.Za)throw Sc("Should only compare child_ events.");return this.g.compare(new K(a.Za,a.Ma),new K(b.Za,b.Ma))};function Od(a,b){this.Sd=a;this.Mf=b}function Pd(a){this.V=a}
Pd.prototype.gb=function(a,b,c,d){var e=new Id,f;if(b.type===ac)b.source.ee?c=Qd(this,a,b.path,b.Ja,c,d,e):(H(b.source.We,"Unknown source."),f=b.source.Ee||Ec(a.w())&&!b.path.e(),c=Rd(this,a,b.path,b.Ja,c,d,f,e));else if(b.type===wd)b.source.ee?c=Sd(this,a,b.path,b.children,c,d,e):(H(b.source.We,"Unknown source."),f=b.source.Ee||Ec(a.w()),c=Td(this,a,b.path,b.children,c,d,f,e));else if(b.type===Ud)if(b.Id)if(b=b.path,null!=c.mc(b))c=a;else{f=new xc(c,a,d);d=a.O.j();if(b.e()||".priority"===J(b))Dc(a.w())?
b=c.Ba(Ac(a)):(b=a.w().j(),H(b instanceof P,"serverChildren would be complete if leaf node"),b=c.sc(b)),b=this.V.za(d,b,e);else{var h=J(b),k=c.rc(h,a.w());null==k&&yc(a.w(),h)&&(k=d.R(h));b=null!=k?this.V.F(d,h,k,D(b),f,e):a.O.j().Fa(h)?this.V.F(d,h,F,D(b),f,e):d;b.e()&&Dc(a.w())&&(d=c.Ba(Ac(a)),d.J()&&(b=this.V.za(b,d,e)))}d=Dc(a.w())||null!=c.mc(C);c=Vd(a,b,d,this.V.Qa())}else c=Wd(this,a,b.path,b.Pb,c,d,e);else if(b.type===cc)d=b.path,b=a.w(),f=b.j(),h=b.ea||d.e(),c=Xd(this,new Yd(a.O,new zc(f,
h,b.Tb)),d,c,wc,e);else throw Sc("Unknown operation type: "+b.type);e=sa(e.hb);d=c;b=d.O;b.ea&&(f=b.j().J()||b.j().e(),h=Zd(a),(0<e.length||!a.O.ea||f&&!b.j().$(h)||!b.j().C().$(h.C()))&&e.push(Bc(Zd(d))));return new Od(c,e)};
function Xd(a,b,c,d,e,f){var h=b.O;if(null!=d.mc(c))return b;var k;if(c.e())H(Dc(b.w()),"If change path is empty, we must have complete server data"),Ec(b.w())?(e=Ac(b),d=d.sc(e instanceof P?e:F)):d=d.Ba(Ac(b)),f=a.V.za(b.O.j(),d,f);else{var m=J(c);if(".priority"==m)H(1==$d(c),"Can't have a priority with additional path components"),f=h.j(),k=b.w().j(),d=d.$c(c,f,k),f=null!=d?a.V.ga(f,d):h.j();else{var l=D(c);yc(h,m)?(k=b.w().j(),d=d.$c(c,h.j(),k),d=null!=d?h.j().R(m).F(l,d):h.j().R(m)):d=d.rc(m,
b.w());f=null!=d?a.V.F(h.j(),m,d,l,e,f):h.j()}}return Vd(b,f,h.ea||c.e(),a.V.Qa())}function Rd(a,b,c,d,e,f,h,k){var m=b.w();h=h?a.V:a.V.Vb();if(c.e())d=h.za(m.j(),d,null);else if(h.Qa()&&!m.Tb)d=m.j().F(c,d),d=h.za(m.j(),d,null);else{var l=J(c);if(!Fc(m,c)&&1<$d(c))return b;var u=D(c);d=m.j().R(l).F(u,d);d=".priority"==l?h.ga(m.j(),d):h.F(m.j(),l,d,u,wc,null)}m=m.ea||c.e();b=new Yd(b.O,new zc(d,m,h.Qa()));return Xd(a,b,c,e,new xc(e,b,f),k)}
function Qd(a,b,c,d,e,f,h){var k=b.O;e=new xc(e,b,f);if(c.e())h=a.V.za(b.O.j(),d,h),a=Vd(b,h,!0,a.V.Qa());else if(f=J(c),".priority"===f)h=a.V.ga(b.O.j(),d),a=Vd(b,h,k.ea,k.Tb);else{c=D(c);var m=k.j().R(f);if(!c.e()){var l=e.Xe(f);d=null!=l?".priority"===ae(c)&&l.Q(c.parent()).e()?l:l.F(c,d):F}m.$(d)?a=b:(h=a.V.F(k.j(),f,d,c,e,h),a=Vd(b,h,k.ea,a.V.Qa()))}return a}
function Sd(a,b,c,d,e,f,h){var k=b;be(d,function(d,l){var u=c.k(d);yc(b.O,J(u))&&(k=Qd(a,k,u,l,e,f,h))});be(d,function(d,l){var u=c.k(d);yc(b.O,J(u))||(k=Qd(a,k,u,l,e,f,h))});return k}function ce(a,b){be(b,function(b,d){a=a.F(b,d)});return a}
function Td(a,b,c,d,e,f,h,k){if(b.w().j().e()&&!Dc(b.w()))return b;var m=b;c=c.e()?d:de(Q,c,d);var l=b.w().j();c.children.ia(function(c,d){if(l.Fa(c)){var G=b.w().j().R(c),G=ce(G,d);m=Rd(a,m,new L(c),G,e,f,h,k)}});c.children.ia(function(c,d){var G=!yc(b.w(),c)&&null==d.value;l.Fa(c)||G||(G=b.w().j().R(c),G=ce(G,d),m=Rd(a,m,new L(c),G,e,f,h,k))});return m}
function Wd(a,b,c,d,e,f,h){if(null!=e.mc(c))return b;var k=Ec(b.w()),m=b.w();if(null!=d.value){if(c.e()&&m.ea||Fc(m,c))return Rd(a,b,c,m.j().Q(c),e,f,k,h);if(c.e()){var l=Q;m.j().P(ee,function(a,b){l=l.set(new L(a),b)});return Td(a,b,c,l,e,f,k,h)}return b}l=Q;be(d,function(a){var b=c.k(a);Fc(m,b)&&(l=l.set(a,m.j().Q(b)))});return Td(a,b,c,l,e,f,k,h)};function fe(a){this.g=a}g=fe.prototype;g.F=function(a,b,c,d,e,f){H(a.zc(this.g),"A node must be indexed if only a child is updated");e=a.R(b);if(e.Q(d).$(c.Q(d))&&e.e()==c.e())return a;null!=f&&(c.e()?a.Fa(b)?Jd(f,new I("child_removed",e,b)):H(a.J(),"A child remove without an old child only makes sense on a leaf node"):e.e()?Jd(f,new I("child_added",c,b)):Jd(f,new I("child_changed",c,b,e)));return a.J()&&c.e()?a:a.U(b,c).ob(this.g)};
g.za=function(a,b,c){null!=c&&(a.J()||a.P(N,function(a,e){b.Fa(a)||Jd(c,new I("child_removed",e,a))}),b.J()||b.P(N,function(b,e){if(a.Fa(b)){var f=a.R(b);f.$(e)||Jd(c,new I("child_changed",e,b,f))}else Jd(c,new I("child_added",e,b))}));return b.ob(this.g)};g.ga=function(a,b){return a.e()?F:a.ga(b)};g.Qa=function(){return!1};g.Vb=function(){return this};function ge(a){this.he=new fe(a.g);this.g=a.g;var b;a.la?(b=he(a),b=a.g.Fc(ie(a),b)):b=a.g.Ic();this.Uc=b;a.oa?(b=je(a),a=a.g.Fc(ke(a),b)):a=a.g.Gc();this.wc=a}g=ge.prototype;g.matches=function(a){return 0>=this.g.compare(this.Uc,a)&&0>=this.g.compare(a,this.wc)};g.F=function(a,b,c,d,e,f){this.matches(new K(b,c))||(c=F);return this.he.F(a,b,c,d,e,f)};
g.za=function(a,b,c){b.J()&&(b=F);var d=b.ob(this.g),d=d.ga(F),e=this;b.P(N,function(a,b){e.matches(new K(a,b))||(d=d.U(a,F))});return this.he.za(a,d,c)};g.ga=function(a){return a};g.Qa=function(){return!0};g.Vb=function(){return this.he};function le(a){this.ta=new ge(a);this.g=a.g;H(a.ya,"Only valid if limit has been set");this.pa=a.pa;this.Jb=!me(a)}g=le.prototype;g.F=function(a,b,c,d,e,f){this.ta.matches(new K(b,c))||(c=F);return a.R(b).$(c)?a:a.Fb()<this.pa?this.ta.Vb().F(a,b,c,d,e,f):ne(this,a,b,c,e,f)};
g.za=function(a,b,c){var d;if(b.J()||b.e())d=F.ob(this.g);else if(2*this.pa<b.Fb()&&b.zc(this.g)){d=F.ob(this.g);b=this.Jb?b.$b(this.ta.wc,this.g):b.Yb(this.ta.Uc,this.g);for(var e=0;0<b.Sa.length&&e<this.pa;){var f=R(b),h;if(h=this.Jb?0>=this.g.compare(this.ta.Uc,f):0>=this.g.compare(f,this.ta.wc))d=d.U(f.name,f.S),e++;else break}}else{d=b.ob(this.g);d=d.ga(F);var k,m,l;if(this.Jb){b=d.$e(this.g);k=this.ta.wc;m=this.ta.Uc;var u=oe(this.g);l=function(a,b){return u(b,a)}}else b=d.Xb(this.g),k=this.ta.Uc,
m=this.ta.wc,l=oe(this.g);for(var e=0,z=!1;0<b.Sa.length;)f=R(b),!z&&0>=l(k,f)&&(z=!0),(h=z&&e<this.pa&&0>=l(f,m))?e++:d=d.U(f.name,F)}return this.ta.Vb().za(a,d,c)};g.ga=function(a){return a};g.Qa=function(){return!0};g.Vb=function(){return this.ta.Vb()};
function ne(a,b,c,d,e,f){var h;if(a.Jb){var k=oe(a.g);h=function(a,b){return k(b,a)}}else h=oe(a.g);H(b.Fb()==a.pa,"");var m=new K(c,d),l=a.Jb?pe(b,a.g):qe(b,a.g),u=a.ta.matches(m);if(b.Fa(c)){for(var z=b.R(c),l=e.fe(a.g,l,a.Jb);null!=l&&(l.name==c||b.Fa(l.name));)l=e.fe(a.g,l,a.Jb);e=null==l?1:h(l,m);if(u&&!d.e()&&0<=e)return null!=f&&Jd(f,new I("child_changed",d,c,z)),b.U(c,d);null!=f&&Jd(f,new I("child_removed",z,c));b=b.U(c,F);return null!=l&&a.ta.matches(l)?(null!=f&&Jd(f,new I("child_added",
l.S,l.name)),b.U(l.name,l.S)):b}return d.e()?b:u&&0<=h(l,m)?(null!=f&&(Jd(f,new I("child_removed",l.S,l.name)),Jd(f,new I("child_added",d,c))),b.U(c,d).U(l.name,F)):b};function Qc(a,b){this.B=a;H(p(this.B)&&null!==this.B,"LeafNode shouldn't be created with null/undefined value.");this.ba=b||F;re(this.ba);this.Eb=null}var se=["object","boolean","number","string"];g=Qc.prototype;g.J=function(){return!0};g.C=function(){return this.ba};g.ga=function(a){return new Qc(this.B,a)};g.R=function(a){return".priority"===a?this.ba:F};g.Q=function(a){return a.e()?this:".priority"===J(a)?this.ba:F};g.Fa=function(){return!1};g.Ze=function(){return null};
g.U=function(a,b){return".priority"===a?this.ga(b):b.e()&&".priority"!==a?this:F.U(a,b).ga(this.ba)};g.F=function(a,b){var c=J(a);if(null===c)return b;if(b.e()&&".priority"!==c)return this;H(".priority"!==c||1===$d(a),".priority must be the last token in a path");return this.U(c,F.F(D(a),b))};g.e=function(){return!1};g.Fb=function(){return 0};g.P=function(){return!1};g.H=function(a){return a&&!this.C().e()?{".value":this.Ea(),".priority":this.C().H()}:this.Ea()};
g.hash=function(){if(null===this.Eb){var a="";this.ba.e()||(a+="priority:"+te(this.ba.H())+":");var b=typeof this.B,a=a+(b+":"),a="number"===b?a+id(this.B):a+this.B;this.Eb=Uc(a)}return this.Eb};g.Ea=function(){return this.B};g.tc=function(a){if(a===F)return 1;if(a instanceof P)return-1;H(a.J(),"Unknown node type");var b=typeof a.B,c=typeof this.B,d=Ia(se,b),e=Ia(se,c);H(0<=d,"Unknown leaf type: "+b);H(0<=e,"Unknown leaf type: "+c);return d===e?"object"===c?0:this.B<a.B?-1:this.B===a.B?0:1:e-d};
g.ob=function(){return this};g.zc=function(){return!0};g.$=function(a){return a===this?!0:a.J()?this.B===a.B&&this.ba.$(a.ba):!1};g.toString=function(){return B(this.H(!0))};function ue(){}var ve={};function oe(a){return r(a.compare,a)}ue.prototype.nd=function(a,b){return 0!==this.compare(new K("[MIN_NAME]",a),new K("[MIN_NAME]",b))};ue.prototype.Ic=function(){return we};function xe(a){H(!a.e()&&".priority"!==J(a),"Can't create PathIndex with empty path or .priority key");this.cc=a}ka(xe,ue);g=xe.prototype;g.yc=function(a){return!a.Q(this.cc).e()};g.compare=function(a,b){var c=a.S.Q(this.cc),d=b.S.Q(this.cc),c=c.tc(d);return 0===c?Hc(a.name,b.name):c};
g.Fc=function(a,b){var c=M(a),c=F.F(this.cc,c);return new K(b,c)};g.Gc=function(){var a=F.F(this.cc,ye);return new K("[MAX_NAME]",a)};g.toString=function(){return this.cc.slice().join("/")};function ze(){}ka(ze,ue);g=ze.prototype;g.compare=function(a,b){var c=a.S.C(),d=b.S.C(),c=c.tc(d);return 0===c?Hc(a.name,b.name):c};g.yc=function(a){return!a.C().e()};g.nd=function(a,b){return!a.C().$(b.C())};g.Ic=function(){return we};g.Gc=function(){return new K("[MAX_NAME]",new Qc("[PRIORITY-POST]",ye))};
g.Fc=function(a,b){var c=M(a);return new K(b,new Qc("[PRIORITY-POST]",c))};g.toString=function(){return".priority"};var N=new ze;function Ae(){}ka(Ae,ue);g=Ae.prototype;g.compare=function(a,b){return Hc(a.name,b.name)};g.yc=function(){throw Sc("KeyIndex.isDefinedOn not expected to be called.");};g.nd=function(){return!1};g.Ic=function(){return we};g.Gc=function(){return new K("[MAX_NAME]",F)};g.Fc=function(a){H(q(a),"KeyIndex indexValue must always be a string.");return new K(a,F)};g.toString=function(){return".key"};
var ee=new Ae;function Be(){}ka(Be,ue);g=Be.prototype;g.compare=function(a,b){var c=a.S.tc(b.S);return 0===c?Hc(a.name,b.name):c};g.yc=function(){return!0};g.nd=function(a,b){return!a.$(b)};g.Ic=function(){return we};g.Gc=function(){return Ce};g.Fc=function(a,b){var c=M(a);return new K(b,c)};g.toString=function(){return".value"};var De=new Be;function Ee(){this.Sb=this.oa=this.Lb=this.la=this.ya=!1;this.pa=0;this.oc="";this.ec=null;this.Ab="";this.bc=null;this.yb="";this.g=N}var Fe=new Ee;function me(a){return""===a.oc?a.la:"l"===a.oc}function ie(a){H(a.la,"Only valid if start has been set");return a.ec}function he(a){H(a.la,"Only valid if start has been set");return a.Lb?a.Ab:"[MIN_NAME]"}function ke(a){H(a.oa,"Only valid if end has been set");return a.bc}
function je(a){H(a.oa,"Only valid if end has been set");return a.Sb?a.yb:"[MAX_NAME]"}function Ge(a){var b=new Ee;b.ya=a.ya;b.pa=a.pa;b.la=a.la;b.ec=a.ec;b.Lb=a.Lb;b.Ab=a.Ab;b.oa=a.oa;b.bc=a.bc;b.Sb=a.Sb;b.yb=a.yb;b.g=a.g;return b}g=Ee.prototype;g.ne=function(a){var b=Ge(this);b.ya=!0;b.pa=a;b.oc="l";return b};g.oe=function(a){var b=Ge(this);b.ya=!0;b.pa=a;b.oc="r";return b};g.Nd=function(a,b){var c=Ge(this);c.la=!0;p(a)||(a=null);c.ec=a;null!=b?(c.Lb=!0,c.Ab=b):(c.Lb=!1,c.Ab="");return c};
g.fd=function(a,b){var c=Ge(this);c.oa=!0;p(a)||(a=null);c.bc=a;p(b)?(c.Sb=!0,c.yb=b):(c.Hg=!1,c.yb="");return c};function He(a,b){var c=Ge(a);c.g=b;return c}function Ie(a){var b={};a.la&&(b.sp=a.ec,a.Lb&&(b.sn=a.Ab));a.oa&&(b.ep=a.bc,a.Sb&&(b.en=a.yb));if(a.ya){b.l=a.pa;var c=a.oc;""===c&&(c=me(a)?"l":"r");b.vf=c}a.g!==N&&(b.i=a.g.toString());return b}function S(a){return!(a.la||a.oa||a.ya)}function rd(a){return S(a)&&a.g==N}
function sd(a){var b={};if(rd(a))return b;var c;a.g===N?c="$priority":a.g===De?c="$value":a.g===ee?c="$key":(H(a.g instanceof xe,"Unrecognized index type!"),c=a.g.toString());b.orderBy=B(c);a.la&&(b.startAt=B(a.ec),a.Lb&&(b.startAt+=","+B(a.Ab)));a.oa&&(b.endAt=B(a.bc),a.Sb&&(b.endAt+=","+B(a.yb)));a.ya&&(me(a)?b.limitToFirst=a.pa:b.limitToLast=a.pa);return b}g.toString=function(){return B(Ie(this))};function Je(a,b){this.od=a;this.dc=b}Je.prototype.get=function(a){var b=x(this.od,a);if(!b)throw Error("No index defined for "+a);return b===ve?null:b};function Ke(a,b,c){var d=oa(a.od,function(d,f){var h=x(a.dc,f);H(h,"Missing index implementation for "+f);if(d===ve){if(h.yc(b.S)){for(var k=[],m=c.Xb(Jc),l=R(m);l;)l.name!=b.name&&k.push(l),l=R(m);k.push(b);return Le(k,oe(h))}return ve}h=c.get(b.name);k=d;h&&(k=k.remove(new K(b.name,h)));return k.Ra(b,b.S)});return new Je(d,a.dc)}
function Me(a,b,c){var d=oa(a.od,function(a){if(a===ve)return a;var d=c.get(b.name);return d?a.remove(new K(b.name,d)):a});return new Je(d,a.dc)}var Ne=new Je({".priority":ve},{".priority":N});function Oe(){this.set={}}g=Oe.prototype;g.add=function(a,b){this.set[a]=null!==b?b:!0};g.contains=function(a){return Bb(this.set,a)};g.get=function(a){return this.contains(a)?this.set[a]:void 0};g.remove=function(a){delete this.set[a]};g.clear=function(){this.set={}};g.e=function(){return xa(this.set)};g.count=function(){return qa(this.set)};function Pe(a,b){t(a.set,function(a,d){b(d,a)})}g.keys=function(){var a=[];t(this.set,function(b,c){a.push(c)});return a};function Qe(a,b,c,d){this.Zd=a;this.f=Yc(a);this.kc=b;this.qb=this.rb=0;this.Xa=Ad(b);this.Bf=c;this.xc=!1;this.Db=d;this.Yc=function(a){return ic(b,"long_polling",a)}}var Re,Se;
Qe.prototype.open=function(a,b){this.Qe=0;this.ja=b;this.ff=new Rb(a);this.Bb=!1;var c=this;this.tb=setTimeout(function(){c.f("Timed out trying to connect.");c.fb();c.tb=null},Math.floor(3E4));cd(function(){if(!c.Bb){c.Wa=new Te(function(a,b,d,k,m){Ue(c,arguments);if(c.Wa)if(c.tb&&(clearTimeout(c.tb),c.tb=null),c.xc=!0,"start"==a)c.id=b,c.mf=d;else if("close"===a)b?(c.Wa.Kd=!1,Sb(c.ff,b,function(){c.fb()})):c.fb();else throw Error("Unrecognized command received: "+a);},function(a,b){Ue(c,arguments);
Tb(c.ff,a,b)},function(){c.fb()},c.Yc);var a={start:"t"};a.ser=Math.floor(1E8*Math.random());c.Wa.Qd&&(a.cb=c.Wa.Qd);a.v="5";c.Bf&&(a.s=c.Bf);c.Db&&(a.ls=c.Db);"undefined"!==typeof location&&location.href&&-1!==location.href.indexOf("firebaseio.com")&&(a.r="f");a=c.Yc(a);c.f("Connecting via long-poll to "+a);Ve(c.Wa,a,function(){})}})};
Qe.prototype.start=function(){var a=this.Wa,b=this.mf;a.fg=this.id;a.gg=b;for(a.Ud=!0;We(a););a=this.id;b=this.mf;this.gc=document.createElement("iframe");var c={dframe:"t"};c.id=a;c.pw=b;this.gc.src=this.Yc(c);this.gc.style.display="none";document.body.appendChild(this.gc)};
Qe.isAvailable=function(){return Re||!Se&&"undefined"!==typeof document&&null!=document.createElement&&!("object"===typeof window&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))&&!("object"===typeof Windows&&"object"===typeof Windows.Dg)&&!0};g=Qe.prototype;g.sd=function(){};g.Tc=function(){this.Bb=!0;this.Wa&&(this.Wa.close(),this.Wa=null);this.gc&&(document.body.removeChild(this.gc),this.gc=null);this.tb&&(clearTimeout(this.tb),this.tb=null)};
g.fb=function(){this.Bb||(this.f("Longpoll is closing itself"),this.Tc(),this.ja&&(this.ja(this.xc),this.ja=null))};g.close=function(){this.Bb||(this.f("Longpoll is being closed."),this.Tc())};g.send=function(a){a=B(a);this.rb+=a.length;kc(this.Xa,"bytes_sent",a.length);a=Mb(a);a=ab(a,!0);a=gd(a,1840);for(var b=0;b<a.length;b++){var c=this.Wa;c.Qc.push({ug:this.Qe,Bg:a.length,Se:a[b]});c.Ud&&We(c);this.Qe++}};function Ue(a,b){var c=B(b).length;a.qb+=c;kc(a.Xa,"bytes_received",c)}
function Te(a,b,c,d){this.Yc=d;this.kb=c;this.ve=new Oe;this.Qc=[];this.$d=Math.floor(1E8*Math.random());this.Kd=!0;this.Qd=Rc();window["pLPCommand"+this.Qd]=a;window["pRTLPCB"+this.Qd]=b;a=document.createElement("iframe");a.style.display="none";if(document.body){document.body.appendChild(a);try{a.contentWindow.document||E("No IE domain setting required")}catch(e){a.src="javascript:void((function(){document.open();document.domain='"+document.domain+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";
a.contentDocument?a.ib=a.contentDocument:a.contentWindow?a.ib=a.contentWindow.document:a.document&&(a.ib=a.document);this.Ga=a;a="";this.Ga.src&&"javascript:"===this.Ga.src.substr(0,11)&&(a='<script>document.domain="'+document.domain+'";\x3c/script>');a="<html><body>"+a+"</body></html>";try{this.Ga.ib.open(),this.Ga.ib.write(a),this.Ga.ib.close()}catch(f){E("frame writing exception"),f.stack&&E(f.stack),E(f)}}
Te.prototype.close=function(){this.Ud=!1;if(this.Ga){this.Ga.ib.body.innerHTML="";var a=this;setTimeout(function(){null!==a.Ga&&(document.body.removeChild(a.Ga),a.Ga=null)},Math.floor(0))}var b=this.kb;b&&(this.kb=null,b())};
function We(a){if(a.Ud&&a.Kd&&a.ve.count()<(0<a.Qc.length?2:1)){a.$d++;var b={};b.id=a.fg;b.pw=a.gg;b.ser=a.$d;for(var b=a.Yc(b),c="",d=0;0<a.Qc.length;)if(1870>=a.Qc[0].Se.length+30+c.length){var e=a.Qc.shift(),c=c+"&seg"+d+"="+e.ug+"&ts"+d+"="+e.Bg+"&d"+d+"="+e.Se;d++}else break;Xe(a,b+c,a.$d);return!0}return!1}function Xe(a,b,c){function d(){a.ve.remove(c);We(a)}a.ve.add(c,1);var e=setTimeout(d,Math.floor(25E3));Ve(a,b,function(){clearTimeout(e);d()})}
function Ve(a,b,c){setTimeout(function(){try{if(a.Kd){var d=a.Ga.ib.createElement("script");d.type="text/javascript";d.async=!0;d.src=b;d.onload=d.onreadystatechange=function(){var a=d.readyState;a&&"loaded"!==a&&"complete"!==a||(d.onload=d.onreadystatechange=null,d.parentNode&&d.parentNode.removeChild(d),c())};d.onerror=function(){E("Long-poll script failed to load: "+b);a.Kd=!1;a.close()};a.Ga.ib.body.appendChild(d)}}catch(e){}},Math.floor(1))};function Ye(a){Ze(this,a)}var $e=[Qe,Dd];function Ze(a,b){var c=Dd&&Dd.isAvailable(),d=c&&!(Yb.cf||!0===Yb.get("previous_websocket_failure"));b.Cg&&(c||O("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),d=!0);if(d)a.Wc=[Dd];else{var e=a.Wc=[];hd($e,function(a,b){b&&b.isAvailable()&&e.push(b)})}}function af(a){if(0<a.Wc.length)return a.Wc[0];throw Error("No transports available");};function bf(a,b,c,d,e,f,h){this.id=a;this.f=Yc("c:"+this.id+":");this.te=c;this.Mc=d;this.ja=e;this.se=f;this.M=b;this.Ad=[];this.Oe=0;this.Af=new Ye(b);this.L=0;this.Db=h;this.f("Connection created");cf(this)}
function cf(a){var b=af(a.Af);a.I=new b("c:"+a.id+":"+a.Oe++,a.M,void 0,a.Db);a.xe=b.responsesRequiredToBeHealthy||0;var c=df(a,a.I),d=ef(a,a.I);a.Xc=a.I;a.Rc=a.I;a.D=null;a.Cb=!1;setTimeout(function(){a.I&&a.I.open(c,d)},Math.floor(0));b=b.healthyTimeout||0;0<b&&(a.md=ld(function(){a.md=null;a.Cb||(a.I&&102400<a.I.qb?(a.f("Connection exceeded healthy timeout but has received "+a.I.qb+" bytes.  Marking connection healthy."),a.Cb=!0,a.I.sd()):a.I&&10240<a.I.rb?a.f("Connection exceeded healthy timeout but has sent "+
a.I.rb+" bytes.  Leaving connection alive."):(a.f("Closing unhealthy connection after timeout."),a.close()))},Math.floor(b)))}function ef(a,b){return function(c){b===a.I?(a.I=null,c||0!==a.L?1===a.L&&a.f("Realtime connection lost."):(a.f("Realtime connection failed."),"s-"===a.M.bb.substr(0,2)&&(Yb.remove("host:"+a.M.host),a.M.bb=a.M.host)),a.close()):b===a.D?(a.f("Secondary connection lost."),c=a.D,a.D=null,a.Xc!==c&&a.Rc!==c||a.close()):a.f("closing an old connection")}}
function df(a,b){return function(c){if(2!=a.L)if(b===a.Rc){var d=ed("t",c);c=ed("d",c);if("c"==d){if(d=ed("t",c),"d"in c)if(c=c.d,"h"===d){var d=c.ts,e=c.v,f=c.h;a.yf=c.s;hc(a.M,f);0==a.L&&(a.I.start(),ff(a,a.I,d),"5"!==e&&O("Protocol version mismatch detected"),c=a.Af,(c=1<c.Wc.length?c.Wc[1]:null)&&gf(a,c))}else if("n"===d){a.f("recvd end transmission on primary");a.Rc=a.D;for(c=0;c<a.Ad.length;++c)a.wd(a.Ad[c]);a.Ad=[];hf(a)}else"s"===d?(a.f("Connection shutdown command received. Shutting down..."),
a.se&&(a.se(c),a.se=null),a.ja=null,a.close()):"r"===d?(a.f("Reset packet received.  New host: "+c),hc(a.M,c),1===a.L?a.close():(jf(a),cf(a))):"e"===d?Zc("Server Error: "+c):"o"===d?(a.f("got pong on primary."),kf(a),lf(a)):Zc("Unknown control packet command: "+d)}else"d"==d&&a.wd(c)}else if(b===a.D)if(d=ed("t",c),c=ed("d",c),"c"==d)"t"in c&&(c=c.t,"a"===c?mf(a):"r"===c?(a.f("Got a reset on secondary, closing it"),a.D.close(),a.Xc!==a.D&&a.Rc!==a.D||a.close()):"o"===c&&(a.f("got pong on secondary."),
a.xf--,mf(a)));else if("d"==d)a.Ad.push(c);else throw Error("Unknown protocol layer: "+d);else a.f("message on old connection")}}bf.prototype.va=function(a){nf(this,{t:"d",d:a})};function hf(a){a.Xc===a.D&&a.Rc===a.D&&(a.f("cleaning up and promoting a connection: "+a.D.Zd),a.I=a.D,a.D=null)}
function mf(a){0>=a.xf?(a.f("Secondary connection is healthy."),a.Cb=!0,a.D.sd(),a.D.start(),a.f("sending client ack on secondary"),a.D.send({t:"c",d:{t:"a",d:{}}}),a.f("Ending transmission on primary"),a.I.send({t:"c",d:{t:"n",d:{}}}),a.Xc=a.D,hf(a)):(a.f("sending ping on secondary."),a.D.send({t:"c",d:{t:"p",d:{}}}))}bf.prototype.wd=function(a){kf(this);this.te(a)};function kf(a){a.Cb||(a.xe--,0>=a.xe&&(a.f("Primary connection is healthy."),a.Cb=!0,a.I.sd()))}
function gf(a,b){a.D=new b("c:"+a.id+":"+a.Oe++,a.M,a.yf);a.xf=b.responsesRequiredToBeHealthy||0;a.D.open(df(a,a.D),ef(a,a.D));ld(function(){a.D&&(a.f("Timed out trying to upgrade."),a.D.close())},Math.floor(6E4))}function ff(a,b,c){a.f("Realtime connection established.");a.I=b;a.L=1;a.Mc&&(a.Mc(c,a.yf),a.Mc=null);0===a.xe?(a.f("Primary connection is healthy."),a.Cb=!0):ld(function(){lf(a)},Math.floor(5E3))}
function lf(a){a.Cb||1!==a.L||(a.f("sending ping on primary."),nf(a,{t:"c",d:{t:"p",d:{}}}))}function nf(a,b){if(1!==a.L)throw"Connection is not connected";a.Xc.send(b)}bf.prototype.close=function(){2!==this.L&&(this.f("Closing realtime connection."),this.L=2,jf(this),this.ja&&(this.ja(),this.ja=null))};function jf(a){a.f("Shutting down all connections");a.I&&(a.I.close(),a.I=null);a.D&&(a.D.close(),a.D=null);a.md&&(clearTimeout(a.md),a.md=null)};function L(a,b){if(1==arguments.length){this.o=a.split("/");for(var c=0,d=0;d<this.o.length;d++)0<this.o[d].length&&(this.o[c]=this.o[d],c++);this.o.length=c;this.Z=0}else this.o=a,this.Z=b}function T(a,b){var c=J(a);if(null===c)return b;if(c===J(b))return T(D(a),D(b));throw Error("INTERNAL ERROR: innerPath ("+b+") is not within outerPath ("+a+")");}
function of(a,b){for(var c=a.slice(),d=b.slice(),e=0;e<c.length&&e<d.length;e++){var f=Hc(c[e],d[e]);if(0!==f)return f}return c.length===d.length?0:c.length<d.length?-1:1}function J(a){return a.Z>=a.o.length?null:a.o[a.Z]}function $d(a){return a.o.length-a.Z}function D(a){var b=a.Z;b<a.o.length&&b++;return new L(a.o,b)}function ae(a){return a.Z<a.o.length?a.o[a.o.length-1]:null}g=L.prototype;
g.toString=function(){for(var a="",b=this.Z;b<this.o.length;b++)""!==this.o[b]&&(a+="/"+this.o[b]);return a||"/"};g.slice=function(a){return this.o.slice(this.Z+(a||0))};g.parent=function(){if(this.Z>=this.o.length)return null;for(var a=[],b=this.Z;b<this.o.length-1;b++)a.push(this.o[b]);return new L(a,0)};
g.k=function(a){for(var b=[],c=this.Z;c<this.o.length;c++)b.push(this.o[c]);if(a instanceof L)for(c=a.Z;c<a.o.length;c++)b.push(a.o[c]);else for(a=a.split("/"),c=0;c<a.length;c++)0<a[c].length&&b.push(a[c]);return new L(b,0)};g.e=function(){return this.Z>=this.o.length};g.$=function(a){if($d(this)!==$d(a))return!1;for(var b=this.Z,c=a.Z;b<=this.o.length;b++,c++)if(this.o[b]!==a.o[c])return!1;return!0};
g.contains=function(a){var b=this.Z,c=a.Z;if($d(this)>$d(a))return!1;for(;b<this.o.length;){if(this.o[b]!==a.o[c])return!1;++b;++c}return!0};var C=new L("");function pf(a,b){this.Ta=a.slice();this.Ka=Math.max(1,this.Ta.length);this.Te=b;for(var c=0;c<this.Ta.length;c++)this.Ka+=Nb(this.Ta[c]);qf(this)}pf.prototype.push=function(a){0<this.Ta.length&&(this.Ka+=1);this.Ta.push(a);this.Ka+=Nb(a);qf(this)};pf.prototype.pop=function(){var a=this.Ta.pop();this.Ka-=Nb(a);0<this.Ta.length&&--this.Ka};
function qf(a){if(768<a.Ka)throw Error(a.Te+"has a key path longer than 768 bytes ("+a.Ka+").");if(32<a.Ta.length)throw Error(a.Te+"path specified exceeds the maximum depth that can be written (32) or object contains a cycle "+rf(a));}function rf(a){return 0==a.Ta.length?"":"in property '"+a.Ta.join(".")+"'"};function sf(a){a instanceof tf||$c("Don't call new Database() directly - please use firebase.database().");this.ua=a;this.ca=new U(a,C);this.INTERNAL=new uf(this)}var vf={TIMESTAMP:{".sv":"timestamp"}};g=sf.prototype;g.app=null;g.pf=function(a){wf(this,"ref");y("database.ref",0,1,arguments.length);return p(a)?this.ca.k(a):this.ca};
g.rg=function(a){wf(this,"database.refFromURL");y("database.refFromURL",1,1,arguments.length);var b=ad(a);xf("database.refFromURL",b);var c=b.kc;c.host!==this.ua.M.host&&$c("database.refFromURL: Host name does not match the current database: (found "+c.host+" but expected "+this.ua.M.host+")");return this.pf(b.path.toString())};function wf(a,b){null===a.ua&&$c("Cannot call "+b+" on a deleted database.")}g.$f=function(){y("database.goOffline",0,0,arguments.length);wf(this,"goOffline");this.ua.eb()};
g.ag=function(){y("database.goOnline",0,0,arguments.length);wf(this,"goOnline");this.ua.lc()};Object.defineProperty(sf.prototype,"app",{get:function(){return this.ua.app}});function uf(a){this.$a=a}uf.prototype.delete=function(){wf(this.$a,"delete");var a=yf.Wb(),b=this.$a.ua;x(a.nb,b.app.name)!==b&&$c("Database "+b.app.name+" has already been deleted.");b.eb();delete a.nb[b.app.name];this.$a.ua=null;this.$a.ca=null;this.$a=this.$a.INTERNAL=null;return firebase.Promise.resolve()};
sf.prototype.ref=sf.prototype.pf;sf.prototype.refFromURL=sf.prototype.rg;sf.prototype.goOnline=sf.prototype.ag;sf.prototype.goOffline=sf.prototype.$f;uf.prototype["delete"]=uf.prototype.delete;function Mc(){this.m=this.B=null}Mc.prototype.find=function(a){if(null!=this.B)return this.B.Q(a);if(a.e()||null==this.m)return null;var b=J(a);a=D(a);return this.m.contains(b)?this.m.get(b).find(a):null};function Oc(a,b,c){if(b.e())a.B=c,a.m=null;else if(null!==a.B)a.B=a.B.F(b,c);else{null==a.m&&(a.m=new Oe);var d=J(b);a.m.contains(d)||a.m.add(d,new Mc);a=a.m.get(d);b=D(b);Oc(a,b,c)}}
function zf(a,b){if(b.e())return a.B=null,a.m=null,!0;if(null!==a.B){if(a.B.J())return!1;var c=a.B;a.B=null;c.P(N,function(b,c){Oc(a,new L(b),c)});return zf(a,b)}return null!==a.m?(c=J(b),b=D(b),a.m.contains(c)&&zf(a.m.get(c),b)&&a.m.remove(c),a.m.e()?(a.m=null,!0):!1):!0}function Nc(a,b,c){null!==a.B?c(b,a.B):a.P(function(a,e){var f=new L(b.toString()+"/"+a);Nc(e,f,c)})}Mc.prototype.P=function(a){null!==this.m&&Pe(this.m,function(b,c){a(b,c)})};var Af=/[\[\].#$\/\u0000-\u001F\u007F]/,Bf=/[\[\].#$\u0000-\u001F\u007F]/;function Cf(a){return q(a)&&0!==a.length&&!Af.test(a)}function Df(a){return null===a||q(a)||fa(a)&&!bd(a)||ha(a)&&Bb(a,".sv")}function Ef(a,b,c,d){d&&!p(b)||Ff(Db(a,1,d),b,c)}
function Ff(a,b,c){c instanceof L&&(c=new pf(c,a));if(!p(b))throw Error(a+"contains undefined "+rf(c));if(ga(b))throw Error(a+"contains a function "+rf(c)+" with contents: "+b.toString());if(bd(b))throw Error(a+"contains "+b.toString()+" "+rf(c));if(q(b)&&b.length>10485760/3&&10485760<Nb(b))throw Error(a+"contains a string greater than 10485760 utf8 bytes "+rf(c)+" ('"+b.substring(0,50)+"...')");if(ha(b)){var d=!1,e=!1;Cb(b,function(b,h){if(".value"===b)d=!0;else if(".priority"!==b&&".sv"!==b&&(e=
!0,!Cf(b)))throw Error(a+" contains an invalid key ("+b+") "+rf(c)+'.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');c.push(b);Ff(a,h,c);c.pop()});if(d&&e)throw Error(a+' contains ".value" child '+rf(c)+" in addition to actual children.");}}
function Gf(a,b){var c,d;for(c=0;c<b.length;c++){d=b[c];for(var e=d.slice(),f=0;f<e.length;f++)if((".priority"!==e[f]||f!==e.length-1)&&!Cf(e[f]))throw Error(a+"contains an invalid key ("+e[f]+") in path "+d.toString()+'. Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');}b.sort(of);e=null;for(c=0;c<b.length;c++){d=b[c];if(null!==e&&e.contains(d))throw Error(a+"contains a path "+e.toString()+" that is ancestor of another path "+d.toString());e=d}}
function Hf(a,b,c){var d=Db(a,1,!1);if(!ha(b)||da(b))throw Error(d+" must be an object containing the children to replace.");var e=[];Cb(b,function(a,b){var k=new L(a);Ff(d,b,c.k(k));if(".priority"===ae(k)&&!Df(b))throw Error(d+"contains an invalid value for '"+k.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");e.push(k)});Gf(d,e)}
function If(a,b,c){if(bd(c))throw Error(Db(a,b,!1)+"is "+c.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!Df(c))throw Error(Db(a,b,!1)+"must be a valid Firebase priority (a string, finite number, server value, or null).");}
function Jf(a,b,c){if(!c||p(b))switch(b){case "value":case "child_added":case "child_removed":case "child_changed":case "child_moved":break;default:throw Error(Db(a,1,c)+'must be a valid event type: "value", "child_added", "child_removed", "child_changed", or "child_moved".');}}function Kf(a,b){if(p(b)&&!Cf(b))throw Error(Db(a,2,!0)+'was an invalid key: "'+b+'".  Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]").');}
function Lf(a,b){if(!q(b)||0===b.length||Bf.test(b))throw Error(Db(a,1,!1)+'was an invalid path: "'+b+'". Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"');}function Mf(a,b){if(".info"===J(b))throw Error(a+" failed: Can't modify data under /.info/");}
function xf(a,b){var c=b.path.toString(),d;!(d=!q(b.kc.host)||0===b.kc.host.length||!Cf(b.kc.pe))&&(d=0!==c.length)&&(c&&(c=c.replace(/^\/*\.info(\/|$)/,"/")),d=!(q(c)&&0!==c.length&&!Bf.test(c)));if(d)throw Error(Db(a,1,!1)+'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".');};function V(a,b){this.ua=a;this.ra=b}V.prototype.cancel=function(a){y("Firebase.onDisconnect().cancel",0,1,arguments.length);A("Firebase.onDisconnect().cancel",1,a,!0);var b=new Hb;this.ua.xd(this.ra,Ib(b,a));return b.sa};V.prototype.cancel=V.prototype.cancel;V.prototype.remove=function(a){y("Firebase.onDisconnect().remove",0,1,arguments.length);Mf("Firebase.onDisconnect().remove",this.ra);A("Firebase.onDisconnect().remove",1,a,!0);var b=new Hb;Nf(this.ua,this.ra,null,Ib(b,a));return b.sa};
V.prototype.remove=V.prototype.remove;V.prototype.set=function(a,b){y("Firebase.onDisconnect().set",1,2,arguments.length);Mf("Firebase.onDisconnect().set",this.ra);Ef("Firebase.onDisconnect().set",a,this.ra,!1);A("Firebase.onDisconnect().set",2,b,!0);var c=new Hb;Nf(this.ua,this.ra,a,Ib(c,b));return c.sa};V.prototype.set=V.prototype.set;
V.prototype.Kb=function(a,b,c){y("Firebase.onDisconnect().setWithPriority",2,3,arguments.length);Mf("Firebase.onDisconnect().setWithPriority",this.ra);Ef("Firebase.onDisconnect().setWithPriority",a,this.ra,!1);If("Firebase.onDisconnect().setWithPriority",2,b);A("Firebase.onDisconnect().setWithPriority",3,c,!0);var d=new Hb;Of(this.ua,this.ra,a,b,Ib(d,c));return d.sa};V.prototype.setWithPriority=V.prototype.Kb;
V.prototype.update=function(a,b){y("Firebase.onDisconnect().update",1,2,arguments.length);Mf("Firebase.onDisconnect().update",this.ra);if(da(a)){for(var c={},d=0;d<a.length;++d)c[""+d]=a[d];a=c;O("Passing an Array to Firebase.onDisconnect().update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.")}Hf("Firebase.onDisconnect().update",a,this.ra);A("Firebase.onDisconnect().update",2,b,!0);
c=new Hb;Pf(this.ua,this.ra,a,Ib(c,b));return c.sa};V.prototype.update=V.prototype.update;function Qf(a){H(da(a)&&0<a.length,"Requires a non-empty array");this.Kf=a;this.Ec={}}Qf.prototype.Ge=function(a,b){var c;c=this.Ec[a]||[];var d=c.length;if(0<d){for(var e=Array(d),f=0;f<d;f++)e[f]=c[f];c=e}else c=[];for(d=0;d<c.length;d++)c[d].Ke.apply(c[d].Pa,Array.prototype.slice.call(arguments,1))};Qf.prototype.hc=function(a,b,c){Rf(this,a);this.Ec[a]=this.Ec[a]||[];this.Ec[a].push({Ke:b,Pa:c});(a=this.Ye(a))&&b.apply(c,a)};
Qf.prototype.Jc=function(a,b,c){Rf(this,a);a=this.Ec[a]||[];for(var d=0;d<a.length;d++)if(a[d].Ke===b&&(!c||c===a[d].Pa)){a.splice(d,1);break}};function Rf(a,b){H(Oa(a.Kf,function(a){return a===b}),"Unknown event: "+b)};function Sf(){Qf.call(this,["online"]);this.ic=!0;if("undefined"!==typeof window&&"undefined"!==typeof window.addEventListener&&!Qb()){var a=this;window.addEventListener("online",function(){a.ic||(a.ic=!0,a.Ge("online",!0))},!1);window.addEventListener("offline",function(){a.ic&&(a.ic=!1,a.Ge("online",!1))},!1)}}ka(Sf,Qf);Sf.prototype.Ye=function(a){H("online"===a,"Unknown event type: "+a);return[this.ic]};ba(Sf);function Tf(){Qf.call(this,["visible"]);var a,b;"undefined"!==typeof document&&"undefined"!==typeof document.addEventListener&&("undefined"!==typeof document.hidden?(b="visibilitychange",a="hidden"):"undefined"!==typeof document.mozHidden?(b="mozvisibilitychange",a="mozHidden"):"undefined"!==typeof document.msHidden?(b="msvisibilitychange",a="msHidden"):"undefined"!==typeof document.webkitHidden&&(b="webkitvisibilitychange",a="webkitHidden"));this.Nb=!0;if(b){var c=this;document.addEventListener(b,
function(){var b=!document[a];b!==c.Nb&&(c.Nb=b,c.Ge("visible",b))},!1)}}ka(Tf,Qf);Tf.prototype.Ye=function(a){H("visible"===a,"Unknown event type: "+a);return[this.Nb]};ba(Tf);var Uf=function(){var a=0,b=[];return function(c){var d=c===a;a=c;for(var e=Array(8),f=7;0<=f;f--)e[f]="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c%64),c=Math.floor(c/64);H(0===c,"Cannot push at time == 0");c=e.join("");if(d){for(f=11;0<=f&&63===b[f];f--)b[f]=0;b[f]++}else for(f=0;12>f;f++)b[f]=Math.floor(64*Math.random());for(f=0;12>f;f++)c+="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);H(20===c.length,"nextPushId: Length should be 20.");
return c}}();function Vf(a,b){this.Oa=a;this.ca=b?b:Wf}g=Vf.prototype;g.Ra=function(a,b){return new Vf(this.Oa,this.ca.Ra(a,b,this.Oa).Y(null,null,!1,null,null))};g.remove=function(a){return new Vf(this.Oa,this.ca.remove(a,this.Oa).Y(null,null,!1,null,null))};g.get=function(a){for(var b,c=this.ca;!c.e();){b=this.Oa(a,c.key);if(0===b)return c.value;0>b?c=c.left:0<b&&(c=c.right)}return null};
function Xf(a,b){for(var c,d=a.ca,e=null;!d.e();){c=a.Oa(b,d.key);if(0===c){if(d.left.e())return e?e.key:null;for(d=d.left;!d.right.e();)d=d.right;return d.key}0>c?d=d.left:0<c&&(e=d,d=d.right)}throw Error("Attempted to find predecessor key for a nonexistent key.  What gives?");}g.e=function(){return this.ca.e()};g.count=function(){return this.ca.count()};g.Hc=function(){return this.ca.Hc()};g.fc=function(){return this.ca.fc()};g.ia=function(a){return this.ca.ia(a)};
g.Xb=function(a){return new Yf(this.ca,null,this.Oa,!1,a)};g.Yb=function(a,b){return new Yf(this.ca,a,this.Oa,!1,b)};g.$b=function(a,b){return new Yf(this.ca,a,this.Oa,!0,b)};g.$e=function(a){return new Yf(this.ca,null,this.Oa,!0,a)};function Yf(a,b,c,d,e){this.Hd=e||null;this.le=d;this.Sa=[];for(e=1;!a.e();)if(e=b?c(a.key,b):1,d&&(e*=-1),0>e)a=this.le?a.left:a.right;else if(0===e){this.Sa.push(a);break}else this.Sa.push(a),a=this.le?a.right:a.left}
function R(a){if(0===a.Sa.length)return null;var b=a.Sa.pop(),c;c=a.Hd?a.Hd(b.key,b.value):{key:b.key,value:b.value};if(a.le)for(b=b.left;!b.e();)a.Sa.push(b),b=b.right;else for(b=b.right;!b.e();)a.Sa.push(b),b=b.left;return c}function Zf(a){if(0===a.Sa.length)return null;var b;b=a.Sa;b=b[b.length-1];return a.Hd?a.Hd(b.key,b.value):{key:b.key,value:b.value}}function $f(a,b,c,d,e){this.key=a;this.value=b;this.color=null!=c?c:!0;this.left=null!=d?d:Wf;this.right=null!=e?e:Wf}g=$f.prototype;
g.Y=function(a,b,c,d,e){return new $f(null!=a?a:this.key,null!=b?b:this.value,null!=c?c:this.color,null!=d?d:this.left,null!=e?e:this.right)};g.count=function(){return this.left.count()+1+this.right.count()};g.e=function(){return!1};g.ia=function(a){return this.left.ia(a)||a(this.key,this.value)||this.right.ia(a)};function ag(a){return a.left.e()?a:ag(a.left)}g.Hc=function(){return ag(this).key};g.fc=function(){return this.right.e()?this.key:this.right.fc()};
g.Ra=function(a,b,c){var d,e;e=this;d=c(a,e.key);e=0>d?e.Y(null,null,null,e.left.Ra(a,b,c),null):0===d?e.Y(null,b,null,null,null):e.Y(null,null,null,null,e.right.Ra(a,b,c));return bg(e)};function cg(a){if(a.left.e())return Wf;a.left.fa()||a.left.left.fa()||(a=dg(a));a=a.Y(null,null,null,cg(a.left),null);return bg(a)}
g.remove=function(a,b){var c,d;c=this;if(0>b(a,c.key))c.left.e()||c.left.fa()||c.left.left.fa()||(c=dg(c)),c=c.Y(null,null,null,c.left.remove(a,b),null);else{c.left.fa()&&(c=eg(c));c.right.e()||c.right.fa()||c.right.left.fa()||(c=fg(c),c.left.left.fa()&&(c=eg(c),c=fg(c)));if(0===b(a,c.key)){if(c.right.e())return Wf;d=ag(c.right);c=c.Y(d.key,d.value,null,null,cg(c.right))}c=c.Y(null,null,null,null,c.right.remove(a,b))}return bg(c)};g.fa=function(){return this.color};
function bg(a){a.right.fa()&&!a.left.fa()&&(a=gg(a));a.left.fa()&&a.left.left.fa()&&(a=eg(a));a.left.fa()&&a.right.fa()&&(a=fg(a));return a}function dg(a){a=fg(a);a.right.left.fa()&&(a=a.Y(null,null,null,null,eg(a.right)),a=gg(a),a=fg(a));return a}function gg(a){return a.right.Y(null,null,a.color,a.Y(null,null,!0,null,a.right.left),null)}function eg(a){return a.left.Y(null,null,a.color,null,a.Y(null,null,!0,a.left.right,null))}
function fg(a){return a.Y(null,null,!a.color,a.left.Y(null,null,!a.left.color,null,null),a.right.Y(null,null,!a.right.color,null,null))}function hg(){}g=hg.prototype;g.Y=function(){return this};g.Ra=function(a,b){return new $f(a,b,null)};g.remove=function(){return this};g.count=function(){return 0};g.e=function(){return!0};g.ia=function(){return!1};g.Hc=function(){return null};g.fc=function(){return null};g.fa=function(){return!1};var Wf=new hg;function P(a,b,c){this.m=a;(this.ba=b)&&re(this.ba);a.e()&&H(!this.ba||this.ba.e(),"An empty node cannot have a priority");this.zb=c;this.Eb=null}g=P.prototype;g.J=function(){return!1};g.C=function(){return this.ba||F};g.ga=function(a){return this.m.e()?this:new P(this.m,a,this.zb)};g.R=function(a){if(".priority"===a)return this.C();a=this.m.get(a);return null===a?F:a};g.Q=function(a){var b=J(a);return null===b?this:this.R(b).Q(D(a))};g.Fa=function(a){return null!==this.m.get(a)};
g.U=function(a,b){H(b,"We should always be passing snapshot nodes");if(".priority"===a)return this.ga(b);var c=new K(a,b),d,e;b.e()?(d=this.m.remove(a),c=Me(this.zb,c,this.m)):(d=this.m.Ra(a,b),c=Ke(this.zb,c,this.m));e=d.e()?F:this.ba;return new P(d,e,c)};g.F=function(a,b){var c=J(a);if(null===c)return b;H(".priority"!==J(a)||1===$d(a),".priority must be the last token in a path");var d=this.R(c).F(D(a),b);return this.U(c,d)};g.e=function(){return this.m.e()};g.Fb=function(){return this.m.count()};
var ig=/^(0|[1-9]\d*)$/;g=P.prototype;g.H=function(a){if(this.e())return null;var b={},c=0,d=0,e=!0;this.P(N,function(f,h){b[f]=h.H(a);c++;e&&ig.test(f)?d=Math.max(d,Number(f)):e=!1});if(!a&&e&&d<2*c){var f=[],h;for(h in b)f[h]=b[h];return f}a&&!this.C().e()&&(b[".priority"]=this.C().H());return b};g.hash=function(){if(null===this.Eb){var a="";this.C().e()||(a+="priority:"+te(this.C().H())+":");this.P(N,function(b,c){var d=c.hash();""!==d&&(a+=":"+b+":"+d)});this.Eb=""===a?"":Uc(a)}return this.Eb};
g.Ze=function(a,b,c){return(c=jg(this,c))?(a=Xf(c,new K(a,b)))?a.name:null:Xf(this.m,a)};function pe(a,b){var c;c=(c=jg(a,b))?(c=c.Hc())&&c.name:a.m.Hc();return c?new K(c,a.m.get(c)):null}function qe(a,b){var c;c=(c=jg(a,b))?(c=c.fc())&&c.name:a.m.fc();return c?new K(c,a.m.get(c)):null}g.P=function(a,b){var c=jg(this,a);return c?c.ia(function(a){return b(a.name,a.S)}):this.m.ia(b)};g.Xb=function(a){return this.Yb(a.Ic(),a)};
g.Yb=function(a,b){var c=jg(this,b);if(c)return c.Yb(a,function(a){return a});for(var c=this.m.Yb(a.name,Jc),d=Zf(c);null!=d&&0>b.compare(d,a);)R(c),d=Zf(c);return c};g.$e=function(a){return this.$b(a.Gc(),a)};g.$b=function(a,b){var c=jg(this,b);if(c)return c.$b(a,function(a){return a});for(var c=this.m.$b(a.name,Jc),d=Zf(c);null!=d&&0<b.compare(d,a);)R(c),d=Zf(c);return c};g.tc=function(a){return this.e()?a.e()?0:-1:a.J()||a.e()?1:a===ye?-1:0};
g.ob=function(a){if(a===ee||ua(this.zb.dc,a.toString()))return this;var b=this.zb,c=this.m;H(a!==ee,"KeyIndex always exists and isn't meant to be added to the IndexMap.");for(var d=[],e=!1,c=c.Xb(Jc),f=R(c);f;)e=e||a.yc(f.S),d.push(f),f=R(c);d=e?Le(d,oe(a)):ve;e=a.toString();c=ya(b.dc);c[e]=a;a=ya(b.od);a[e]=d;return new P(this.m,this.ba,new Je(a,c))};g.zc=function(a){return a===ee||ua(this.zb.dc,a.toString())};
g.$=function(a){if(a===this)return!0;if(a.J())return!1;if(this.C().$(a.C())&&this.m.count()===a.m.count()){var b=this.Xb(N);a=a.Xb(N);for(var c=R(b),d=R(a);c&&d;){if(c.name!==d.name||!c.S.$(d.S))return!1;c=R(b);d=R(a)}return null===c&&null===d}return!1};function jg(a,b){return b===ee?null:a.zb.get(b.toString())}g.toString=function(){return B(this.H(!0))};function M(a,b){if(null===a)return F;var c=null;"object"===typeof a&&".priority"in a?c=a[".priority"]:"undefined"!==typeof b&&(c=b);H(null===c||"string"===typeof c||"number"===typeof c||"object"===typeof c&&".sv"in c,"Invalid priority type found: "+typeof c);"object"===typeof a&&".value"in a&&null!==a[".value"]&&(a=a[".value"]);if("object"!==typeof a||".sv"in a)return new Qc(a,M(c));if(a instanceof Array){var d=F,e=a;t(e,function(a,b){if(Bb(e,b)&&"."!==b.substring(0,1)){var c=M(a);if(c.J()||!c.e())d=
d.U(b,c)}});return d.ga(M(c))}var f=[],h=!1,k=a;Cb(k,function(a){if("string"!==typeof a||"."!==a.substring(0,1)){var b=M(k[a]);b.e()||(h=h||!b.C().e(),f.push(new K(a,b)))}});if(0==f.length)return F;var m=Le(f,Gc,function(a){return a.name},Ic);if(h){var l=Le(f,oe(N));return new P(m,M(c),new Je({".priority":l},{".priority":N}))}return new P(m,M(c),Ne)}var kg=Math.log(2);
function lg(a){this.count=parseInt(Math.log(a+1)/kg,10);this.Re=this.count-1;this.Lf=a+1&parseInt(Array(this.count+1).join("1"),2)}function mg(a){var b=!(a.Lf&1<<a.Re);a.Re--;return b}
function Le(a,b,c,d){function e(b,d){var f=d-b;if(0==f)return null;if(1==f){var l=a[b],u=c?c(l):l;return new $f(u,l.S,!1,null,null)}var l=parseInt(f/2,10)+b,f=e(b,l),z=e(l+1,d),l=a[l],u=c?c(l):l;return new $f(u,l.S,!1,f,z)}a.sort(b);var f=function(b){function d(b,h){var k=u-b,z=u;u-=b;var z=e(k+1,z),k=a[k],G=c?c(k):k,z=new $f(G,k.S,h,null,z);f?f.left=z:l=z;f=z}for(var f=null,l=null,u=a.length,z=0;z<b.count;++z){var G=mg(b),ud=Math.pow(2,b.count-(z+1));G?d(ud,!1):(d(ud,!1),d(ud,!0))}return l}(new lg(a.length));
return null!==f?new Vf(d||b,f):new Vf(d||b)}function te(a){return"number"===typeof a?"number:"+id(a):"string:"+a}function re(a){if(a.J()){var b=a.H();H("string"===typeof b||"number"===typeof b||"object"===typeof b&&Bb(b,".sv"),"Priority must be a string or number.")}else H(a===ye||a.e(),"priority of unexpected type.");H(a===ye||a.C().e(),"Priority nodes can't have a priority of their own.")}var F=new P(new Vf(Ic),null,Ne);function ng(){P.call(this,new Vf(Ic),F,Ne)}ka(ng,P);g=ng.prototype;
g.tc=function(a){return a===this?0:1};g.$=function(a){return a===this};g.C=function(){return this};g.R=function(){return F};g.e=function(){return!1};var ye=new ng,we=new K("[MIN_NAME]",F),Ce=new K("[MAX_NAME]",ye);function W(a,b,c){this.A=a;this.W=b;this.g=c}W.prototype.H=function(){y("Firebase.DataSnapshot.val",0,0,arguments.length);return this.A.H()};W.prototype.val=W.prototype.H;W.prototype.Ue=function(){y("Firebase.DataSnapshot.exportVal",0,0,arguments.length);return this.A.H(!0)};W.prototype.exportVal=W.prototype.Ue;W.prototype.Vf=function(){y("Firebase.DataSnapshot.exists",0,0,arguments.length);return!this.A.e()};W.prototype.exists=W.prototype.Vf;
W.prototype.k=function(a){y("Firebase.DataSnapshot.child",0,1,arguments.length);fa(a)&&(a=String(a));Lf("Firebase.DataSnapshot.child",a);var b=new L(a),c=this.W.k(b);return new W(this.A.Q(b),c,N)};W.prototype.child=W.prototype.k;W.prototype.Fa=function(a){y("Firebase.DataSnapshot.hasChild",1,1,arguments.length);Lf("Firebase.DataSnapshot.hasChild",a);var b=new L(a);return!this.A.Q(b).e()};W.prototype.hasChild=W.prototype.Fa;
W.prototype.C=function(){y("Firebase.DataSnapshot.getPriority",0,0,arguments.length);return this.A.C().H()};W.prototype.getPriority=W.prototype.C;W.prototype.forEach=function(a){y("Firebase.DataSnapshot.forEach",1,1,arguments.length);A("Firebase.DataSnapshot.forEach",1,a,!1);if(this.A.J())return!1;var b=this;return!!this.A.P(this.g,function(c,d){return a(new W(d,b.W.k(c),N))})};W.prototype.forEach=W.prototype.forEach;
W.prototype.kd=function(){y("Firebase.DataSnapshot.hasChildren",0,0,arguments.length);return this.A.J()?!1:!this.A.e()};W.prototype.hasChildren=W.prototype.kd;W.prototype.getKey=function(){y("Firebase.DataSnapshot.key",0,0,arguments.length);return this.W.getKey()};kd(W.prototype,"key",W.prototype.getKey);W.prototype.Fb=function(){y("Firebase.DataSnapshot.numChildren",0,0,arguments.length);return this.A.Fb()};W.prototype.numChildren=W.prototype.Fb;
W.prototype.xb=function(){y("Firebase.DataSnapshot.ref",0,0,arguments.length);return this.W};kd(W.prototype,"ref",W.prototype.xb);function Yd(a,b){this.O=a;this.Ld=b}function Vd(a,b,c,d){return new Yd(new zc(b,c,d),a.Ld)}function Zd(a){return a.O.ea?a.O.j():null}Yd.prototype.w=function(){return this.Ld};function Ac(a){return a.Ld.ea?a.Ld.j():null};function og(a,b){this.W=a;var c=a.n,d=new fe(c.g),c=S(c)?new fe(c.g):c.ya?new le(c):new ge(c);this.of=new Pd(c);var e=b.w(),f=b.O,h=d.za(F,e.j(),null),k=c.za(F,f.j(),null);this.Na=new Yd(new zc(k,f.ea,c.Qa()),new zc(h,e.ea,d.Qa()));this.ab=[];this.Sf=new Kd(a)}function pg(a){return a.W}g=og.prototype;g.w=function(){return this.Na.w().j()};g.jb=function(a){var b=Ac(this.Na);return b&&(S(this.W.n)||!a.e()&&!b.R(J(a)).e())?b.Q(a):null};g.e=function(){return 0===this.ab.length};g.Ob=function(a){this.ab.push(a)};
g.mb=function(a,b){var c=[];if(b){H(null==a,"A cancel should cancel all event registrations.");var d=this.W.path;Ja(this.ab,function(a){(a=a.Pe(b,d))&&c.push(a)})}if(a){for(var e=[],f=0;f<this.ab.length;++f){var h=this.ab[f];if(!h.matches(a))e.push(h);else if(a.af()){e=e.concat(this.ab.slice(f+1));break}}this.ab=e}else this.ab=[];return c};
g.gb=function(a,b,c){a.type===wd&&null!==a.source.Ib&&(H(Ac(this.Na),"We should always have a full cache before handling merges"),H(Zd(this.Na),"Missing event cache, even though we have a server cache"));var d=this.Na;a=this.of.gb(d,a,b,c);b=this.of;c=a.Sd;H(c.O.j().zc(b.V.g),"Event snap not indexed");H(c.w().j().zc(b.V.g),"Server snap not indexed");H(Dc(a.Sd.w())||!Dc(d.w()),"Once a server snap is complete, it should never go back");this.Na=a.Sd;return qg(this,a.Mf,a.Sd.O.j(),null)};
function rg(a,b){var c=a.Na.O,d=[];c.j().J()||c.j().P(N,function(a,b){d.push(new I("child_added",b,a))});c.ea&&d.push(Bc(c.j()));return qg(a,d,c.j(),b)}function qg(a,b,c,d){return Ld(a.Sf,b,c,d?[d]:a.ab)};function sg(a,b,c){this.Qb=a;this.sb=b;this.ub=c||null}g=sg.prototype;g.tf=function(a){return"value"===a};g.createEvent=function(a,b){var c=b.n.g;return new tc("value",this,new W(a.Ma,b.xb(),c))};g.Ub=function(a){var b=this.ub;if("cancel"===a.ge()){H(this.sb,"Raising a cancel event on a listener with no cancel callback");var c=this.sb;return function(){c.call(b,a.error)}}var d=this.Qb;return function(){d.call(b,a.Md)}};g.Pe=function(a,b){return this.sb?new uc(this,a,b):null};
g.matches=function(a){return a instanceof sg?a.Qb&&this.Qb?a.Qb===this.Qb&&a.ub===this.ub:!0:!1};g.af=function(){return null!==this.Qb};function tg(a,b,c){this.ha=a;this.sb=b;this.ub=c}g=tg.prototype;g.tf=function(a){a="children_added"===a?"child_added":a;return("children_removed"===a?"child_removed":a)in this.ha};g.Pe=function(a,b){return this.sb?new uc(this,a,b):null};
g.createEvent=function(a,b){H(null!=a.Za,"Child events should have a childName.");var c=b.xb().k(a.Za);return new tc(a.type,this,new W(a.Ma,c,b.n.g),a.Dd)};g.Ub=function(a){var b=this.ub;if("cancel"===a.ge()){H(this.sb,"Raising a cancel event on a listener with no cancel callback");var c=this.sb;return function(){c.call(b,a.error)}}var d=this.ha[a.gd];return function(){d.call(b,a.Md,a.Dd)}};
g.matches=function(a){if(a instanceof tg){if(!this.ha||!a.ha)return!0;if(this.ub===a.ub){var b=qa(a.ha);if(b===qa(this.ha)){if(1===b){var b=ra(a.ha),c=ra(this.ha);return c===b&&(!a.ha[b]||!this.ha[c]||a.ha[b]===this.ha[c])}return pa(this.ha,function(b,c){return a.ha[c]===b})}}}return!1};g.af=function(){return null!==this.ha};function X(a,b,c,d){this.u=a;this.path=b;this.n=c;this.Oc=d}
function ug(a){var b=null,c=null;a.la&&(b=ie(a));a.oa&&(c=ke(a));if(a.g===ee){if(a.la){if("[MIN_NAME]"!=he(a))throw Error("Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().");if("string"!==typeof b)throw Error("Query: When ordering by key, the argument passed to startAt(), endAt(),or equalTo() must be a string.");}if(a.oa){if("[MAX_NAME]"!=je(a))throw Error("Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().");if("string"!==
typeof c)throw Error("Query: When ordering by key, the argument passed to startAt(), endAt(),or equalTo() must be a string.");}}else if(a.g===N){if(null!=b&&!Df(b)||null!=c&&!Df(c))throw Error("Query: When ordering by priority, the first argument passed to startAt(), endAt(), or equalTo() must be a valid priority value (null, a number, or a string).");}else if(H(a.g instanceof xe||a.g===De,"unknown index type."),null!=b&&"object"===typeof b||null!=c&&"object"===typeof c)throw Error("Query: First argument passed to startAt(), endAt(), or equalTo() cannot be an object.");
}function vg(a){if(a.la&&a.oa&&a.ya&&(!a.ya||""===a.oc))throw Error("Query: Can't combine startAt(), endAt(), and limit(). Use limitToFirst() or limitToLast() instead.");}function wg(a,b){if(!0===a.Oc)throw Error(b+": You can't combine multiple orderBy calls.");}g=X.prototype;g.xb=function(){y("Query.ref",0,0,arguments.length);return new U(this.u,this.path)};
g.hc=function(a,b,c,d){y("Query.on",2,4,arguments.length);Jf("Query.on",a,!1);A("Query.on",2,b,!1);var e=xg("Query.on",c,d);if("value"===a)yg(this.u,this,new sg(b,e.cancel||null,e.Pa||null));else{var f={};f[a]=b;yg(this.u,this,new tg(f,e.cancel,e.Pa))}return b};
g.Jc=function(a,b,c){y("Query.off",0,3,arguments.length);Jf("Query.off",a,!0);A("Query.off",2,b,!0);Eb("Query.off",3,c);var d=null,e=null;"value"===a?d=new sg(b||null,null,c||null):a&&(b&&(e={},e[a]=b),d=new tg(e,null,c||null));e=this.u;d=".info"===J(this.path)?e.pd.mb(this,d):e.K.mb(this,d);pc(e.da,this.path,d)};
g.kg=function(a,b){function c(k){f&&(f=!1,e.Jc(a,c),b&&b.call(d.Pa,k),h.resolve(k))}y("Query.once",1,4,arguments.length);Jf("Query.once",a,!1);A("Query.once",2,b,!0);var d=xg("Query.once",arguments[2],arguments[3]),e=this,f=!0,h=new Hb;Jb(h.sa);this.hc(a,c,function(b){e.Jc(a,c);d.cancel&&d.cancel.call(d.Pa,b);h.reject(b)});return h.sa};
g.ne=function(a){y("Query.limitToFirst",1,1,arguments.length);if(!fa(a)||Math.floor(a)!==a||0>=a)throw Error("Query.limitToFirst: First argument must be a positive integer.");if(this.n.ya)throw Error("Query.limitToFirst: Limit was already set (by another call to limit, limitToFirst, or limitToLast).");return new X(this.u,this.path,this.n.ne(a),this.Oc)};
g.oe=function(a){y("Query.limitToLast",1,1,arguments.length);if(!fa(a)||Math.floor(a)!==a||0>=a)throw Error("Query.limitToLast: First argument must be a positive integer.");if(this.n.ya)throw Error("Query.limitToLast: Limit was already set (by another call to limit, limitToFirst, or limitToLast).");return new X(this.u,this.path,this.n.oe(a),this.Oc)};
g.lg=function(a){y("Query.orderByChild",1,1,arguments.length);if("$key"===a)throw Error('Query.orderByChild: "$key" is invalid.  Use Query.orderByKey() instead.');if("$priority"===a)throw Error('Query.orderByChild: "$priority" is invalid.  Use Query.orderByPriority() instead.');if("$value"===a)throw Error('Query.orderByChild: "$value" is invalid.  Use Query.orderByValue() instead.');Lf("Query.orderByChild",a);wg(this,"Query.orderByChild");var b=new L(a);if(b.e())throw Error("Query.orderByChild: cannot pass in empty path.  Use Query.orderByValue() instead.");
b=new xe(b);b=He(this.n,b);ug(b);return new X(this.u,this.path,b,!0)};g.mg=function(){y("Query.orderByKey",0,0,arguments.length);wg(this,"Query.orderByKey");var a=He(this.n,ee);ug(a);return new X(this.u,this.path,a,!0)};g.ng=function(){y("Query.orderByPriority",0,0,arguments.length);wg(this,"Query.orderByPriority");var a=He(this.n,N);ug(a);return new X(this.u,this.path,a,!0)};
g.og=function(){y("Query.orderByValue",0,0,arguments.length);wg(this,"Query.orderByValue");var a=He(this.n,De);ug(a);return new X(this.u,this.path,a,!0)};g.Nd=function(a,b){y("Query.startAt",0,2,arguments.length);Ef("Query.startAt",a,this.path,!0);Kf("Query.startAt",b);var c=this.n.Nd(a,b);vg(c);ug(c);if(this.n.la)throw Error("Query.startAt: Starting point was already set (by another call to startAt or equalTo).");p(a)||(b=a=null);return new X(this.u,this.path,c,this.Oc)};
g.fd=function(a,b){y("Query.endAt",0,2,arguments.length);Ef("Query.endAt",a,this.path,!0);Kf("Query.endAt",b);var c=this.n.fd(a,b);vg(c);ug(c);if(this.n.oa)throw Error("Query.endAt: Ending point was already set (by another call to endAt or equalTo).");return new X(this.u,this.path,c,this.Oc)};
g.Rf=function(a,b){y("Query.equalTo",1,2,arguments.length);Ef("Query.equalTo",a,this.path,!1);Kf("Query.equalTo",b);if(this.n.la)throw Error("Query.equalTo: Starting point was already set (by another call to endAt or equalTo).");if(this.n.oa)throw Error("Query.equalTo: Ending point was already set (by another call to endAt or equalTo).");return this.Nd(a,b).fd(a,b)};
g.toString=function(){y("Query.toString",0,0,arguments.length);for(var a=this.path,b="",c=a.Z;c<a.o.length;c++)""!==a.o[c]&&(b+="/"+encodeURIComponent(String(a.o[c])));return this.u.toString()+(b||"/")};g.ka=function(){var a=fd(Ie(this.n));return"{}"===a?"default":a};
g.isEqual=function(a){y("Query.isEqual",1,1,arguments.length);if(!(a instanceof X))throw Error("Query.isEqual failed: First argument must be an instance of firebase.database.Query.");var b=this.u===a.u,c=this.path.$(a.path),d=this.ka()===a.ka();return b&&c&&d};
function xg(a,b,c){var d={cancel:null,Pa:null};if(b&&c)d.cancel=b,A(a,3,d.cancel,!0),d.Pa=c,Eb(a,4,d.Pa);else if(b)if("object"===typeof b&&null!==b)d.Pa=b;else if("function"===typeof b)d.cancel=b;else throw Error(Db(a,3,!0)+" must either be a cancel callback or a context object.");return d}X.prototype.on=X.prototype.hc;X.prototype.off=X.prototype.Jc;X.prototype.once=X.prototype.kg;X.prototype.limitToFirst=X.prototype.ne;X.prototype.limitToLast=X.prototype.oe;X.prototype.orderByChild=X.prototype.lg;
X.prototype.orderByKey=X.prototype.mg;X.prototype.orderByPriority=X.prototype.ng;X.prototype.orderByValue=X.prototype.og;X.prototype.startAt=X.prototype.Nd;X.prototype.endAt=X.prototype.fd;X.prototype.equalTo=X.prototype.Rf;X.prototype.toString=X.prototype.toString;X.prototype.isEqual=X.prototype.isEqual;kd(X.prototype,"ref",X.prototype.xb);function zg(a,b){this.value=a;this.children=b||Ag}var Ag=new Vf(function(a,b){return a===b?0:a<b?-1:1});function Bg(a){var b=Q;t(a,function(a,d){b=b.set(new L(d),a)});return b}g=zg.prototype;g.e=function(){return null===this.value&&this.children.e()};function Cg(a,b,c){if(null!=a.value&&c(a.value))return{path:C,value:a.value};if(b.e())return null;var d=J(b);a=a.children.get(d);return null!==a?(b=Cg(a,D(b),c),null!=b?{path:(new L(d)).k(b.path),value:b.value}:null):null}
function Dg(a,b){return Cg(a,b,function(){return!0})}g.subtree=function(a){if(a.e())return this;var b=this.children.get(J(a));return null!==b?b.subtree(D(a)):Q};g.set=function(a,b){if(a.e())return new zg(b,this.children);var c=J(a),d=(this.children.get(c)||Q).set(D(a),b),c=this.children.Ra(c,d);return new zg(this.value,c)};
g.remove=function(a){if(a.e())return this.children.e()?Q:new zg(null,this.children);var b=J(a),c=this.children.get(b);return c?(a=c.remove(D(a)),b=a.e()?this.children.remove(b):this.children.Ra(b,a),null===this.value&&b.e()?Q:new zg(this.value,b)):this};g.get=function(a){if(a.e())return this.value;var b=this.children.get(J(a));return b?b.get(D(a)):null};
function de(a,b,c){if(b.e())return c;var d=J(b);b=de(a.children.get(d)||Q,D(b),c);d=b.e()?a.children.remove(d):a.children.Ra(d,b);return new zg(a.value,d)}function Eg(a,b){return Fg(a,C,b)}function Fg(a,b,c){var d={};a.children.ia(function(a,f){d[a]=Fg(f,b.k(a),c)});return c(b,a.value,d)}function Gg(a,b,c){return Hg(a,b,C,c)}function Hg(a,b,c,d){var e=a.value?d(c,a.value):!1;if(e)return e;if(b.e())return null;e=J(b);return(a=a.children.get(e))?Hg(a,D(b),c.k(e),d):null}
function Ig(a,b,c){Jg(a,b,C,c)}function Jg(a,b,c,d){if(b.e())return a;a.value&&d(c,a.value);var e=J(b);return(a=a.children.get(e))?Jg(a,D(b),c.k(e),d):Q}function be(a,b){Kg(a,C,b)}function Kg(a,b,c){a.children.ia(function(a,e){Kg(e,b.k(a),c)});a.value&&c(b,a.value)}function Lg(a,b){a.children.ia(function(a,d){d.value&&b(a,d.value)})}var Q=new zg(null);zg.prototype.toString=function(){var a={};be(this,function(b,c){a[b.toString()]=c.toString()});return B(a)};function Mg(a,b,c){this.type=Ud;this.source=Ng;this.path=a;this.Pb=b;this.Id=c}Mg.prototype.Nc=function(a){if(this.path.e()){if(null!=this.Pb.value)return H(this.Pb.children.e(),"affectedTree should not have overlapping affected paths."),this;a=this.Pb.subtree(new L(a));return new Mg(C,a,this.Id)}H(J(this.path)===a,"operationForChild called for unrelated child.");return new Mg(D(this.path),this.Pb,this.Id)};
Mg.prototype.toString=function(){return"Operation("+this.path+": "+this.source.toString()+" ack write revert="+this.Id+" affectedTree="+this.Pb+")"};var ac=0,wd=1,Ud=2,cc=3;function Og(a,b,c,d){this.ee=a;this.We=b;this.Ib=c;this.Ee=d;H(!d||b,"Tagged queries must be from server.")}var Ng=new Og(!0,!1,null,!1),Pg=new Og(!1,!0,null,!1);Og.prototype.toString=function(){return this.ee?"user":this.Ee?"server(queryID="+this.Ib+")":"server"};function Qg(a){this.X=a}var Rg=new Qg(new zg(null));function Sg(a,b,c){if(b.e())return new Qg(new zg(c));var d=Dg(a.X,b);if(null!=d){var e=d.path,d=d.value;b=T(e,b);d=d.F(b,c);return new Qg(a.X.set(e,d))}a=de(a.X,b,new zg(c));return new Qg(a)}function Tg(a,b,c){var d=a;Cb(c,function(a,c){d=Sg(d,b.k(a),c)});return d}Qg.prototype.Ed=function(a){if(a.e())return Rg;a=de(this.X,a,Q);return new Qg(a)};function Ug(a,b){var c=Dg(a.X,b);return null!=c?a.X.get(c.path).Q(T(c.path,b)):null}
function Vg(a){var b=[],c=a.X.value;null!=c?c.J()||c.P(N,function(a,c){b.push(new K(a,c))}):a.X.children.ia(function(a,c){null!=c.value&&b.push(new K(a,c.value))});return b}function Wg(a,b){if(b.e())return a;var c=Ug(a,b);return null!=c?new Qg(new zg(c)):new Qg(a.X.subtree(b))}Qg.prototype.e=function(){return this.X.e()};Qg.prototype.apply=function(a){return Xg(C,this.X,a)};
function Xg(a,b,c){if(null!=b.value)return c.F(a,b.value);var d=null;b.children.ia(function(b,f){".priority"===b?(H(null!==f.value,"Priority writes must always be leaf nodes"),d=f.value):c=Xg(a.k(b),f,c)});c.Q(a).e()||null===d||(c=c.F(a.k(".priority"),d));return c};function Yg(){this.Aa={}}g=Yg.prototype;g.e=function(){return xa(this.Aa)};g.gb=function(a,b,c){var d=a.source.Ib;if(null!==d)return d=x(this.Aa,d),H(null!=d,"SyncTree gave us an op for an invalid query."),d.gb(a,b,c);var e=[];t(this.Aa,function(d){e=e.concat(d.gb(a,b,c))});return e};g.Ob=function(a,b,c,d,e){var f=a.ka(),h=x(this.Aa,f);if(!h){var h=c.Ba(e?d:null),k=!1;h?k=!0:(h=d instanceof P?c.sc(d):F,k=!1);h=new og(a,new Yd(new zc(h,k,!1),new zc(d,e,!1)));this.Aa[f]=h}h.Ob(b);return rg(h,b)};
g.mb=function(a,b,c){var d=a.ka(),e=[],f=[],h=null!=Zg(this);if("default"===d){var k=this;t(this.Aa,function(a,d){f=f.concat(a.mb(b,c));a.e()&&(delete k.Aa[d],S(a.W.n)||e.push(a.W))})}else{var m=x(this.Aa,d);m&&(f=f.concat(m.mb(b,c)),m.e()&&(delete this.Aa[d],S(m.W.n)||e.push(m.W)))}h&&null==Zg(this)&&e.push(new U(a.u,a.path));return{sg:e,Tf:f}};function $g(a){return Ka(sa(a.Aa),function(a){return!S(a.W.n)})}g.jb=function(a){var b=null;t(this.Aa,function(c){b=b||c.jb(a)});return b};
function ah(a,b){if(S(b.n))return Zg(a);var c=b.ka();return x(a.Aa,c)}function Zg(a){return wa(a.Aa,function(a){return S(a.W.n)})||null};function bh(){this.T=Rg;this.ma=[];this.Cc=-1}function ch(a,b){for(var c=0;c<a.ma.length;c++){var d=a.ma[c];if(d.Zc===b)return d}return null}g=bh.prototype;
g.Ed=function(a){var b=Pa(this.ma,function(b){return b.Zc===a});H(0<=b,"removeWrite called with nonexistent writeId.");var c=this.ma[b];this.ma.splice(b,1);for(var d=c.visible,e=!1,f=this.ma.length-1;d&&0<=f;){var h=this.ma[f];h.visible&&(f>=b&&dh(h,c.path)?d=!1:c.path.contains(h.path)&&(e=!0));f--}if(d){if(e)this.T=eh(this.ma,fh,C),this.Cc=0<this.ma.length?this.ma[this.ma.length-1].Zc:-1;else if(c.Ja)this.T=this.T.Ed(c.path);else{var k=this;t(c.children,function(a,b){k.T=k.T.Ed(c.path.k(b))})}return!0}return!1};
g.Ba=function(a,b,c,d){if(c||d){var e=Wg(this.T,a);return!d&&e.e()?b:d||null!=b||null!=Ug(e,C)?(e=eh(this.ma,function(b){return(b.visible||d)&&(!c||!(0<=Ia(c,b.Zc)))&&(b.path.contains(a)||a.contains(b.path))},a),b=b||F,e.apply(b)):null}e=Ug(this.T,a);if(null!=e)return e;e=Wg(this.T,a);return e.e()?b:null!=b||null!=Ug(e,C)?(b=b||F,e.apply(b)):null};
g.sc=function(a,b){var c=F,d=Ug(this.T,a);if(d)d.J()||d.P(N,function(a,b){c=c.U(a,b)});else if(b){var e=Wg(this.T,a);b.P(N,function(a,b){var d=Wg(e,new L(a)).apply(b);c=c.U(a,d)});Ja(Vg(e),function(a){c=c.U(a.name,a.S)})}else e=Wg(this.T,a),Ja(Vg(e),function(a){c=c.U(a.name,a.S)});return c};g.$c=function(a,b,c,d){H(c||d,"Either existingEventSnap or existingServerSnap must exist");a=a.k(b);if(null!=Ug(this.T,a))return null;a=Wg(this.T,a);return a.e()?d.Q(b):a.apply(d.Q(b))};
g.rc=function(a,b,c){a=a.k(b);var d=Ug(this.T,a);return null!=d?d:yc(c,b)?Wg(this.T,a).apply(c.j().R(b)):null};g.mc=function(a){return Ug(this.T,a)};g.Xd=function(a,b,c,d,e,f){var h;a=Wg(this.T,a);h=Ug(a,C);if(null==h)if(null!=b)h=a.apply(b);else return[];h=h.ob(f);if(h.e()||h.J())return[];b=[];a=oe(f);e=e?h.$b(c,f):h.Yb(c,f);for(f=R(e);f&&b.length<d;)0!==a(f,c)&&b.push(f),f=R(e);return b};
function dh(a,b){return a.Ja?a.path.contains(b):!!va(a.children,function(c,d){return a.path.k(d).contains(b)})}function fh(a){return a.visible}
function eh(a,b,c){for(var d=Rg,e=0;e<a.length;++e){var f=a[e];if(b(f)){var h=f.path;if(f.Ja)c.contains(h)?(h=T(c,h),d=Sg(d,h,f.Ja)):h.contains(c)&&(h=T(h,c),d=Sg(d,C,f.Ja.Q(h)));else if(f.children)if(c.contains(h))h=T(c,h),d=Tg(d,h,f.children);else{if(h.contains(c))if(h=T(h,c),h.e())d=Tg(d,C,f.children);else if(f=x(f.children,J(h)))f=f.Q(D(h)),d=Sg(d,C,f)}else throw Sc("WriteRecord should have .snap or .children");}}return d}function gh(a,b){this.Mb=a;this.X=b}g=gh.prototype;
g.Ba=function(a,b,c){return this.X.Ba(this.Mb,a,b,c)};g.sc=function(a){return this.X.sc(this.Mb,a)};g.$c=function(a,b,c){return this.X.$c(this.Mb,a,b,c)};g.mc=function(a){return this.X.mc(this.Mb.k(a))};g.Xd=function(a,b,c,d,e){return this.X.Xd(this.Mb,a,b,c,d,e)};g.rc=function(a,b){return this.X.rc(this.Mb,a,b)};g.k=function(a){return new gh(this.Mb.k(a),this.X)};function hh(){this.children={};this.ad=0;this.value=null}function ih(a,b,c){this.ud=a?a:"";this.Ha=b?b:null;this.A=c?c:new hh}function jh(a,b){for(var c=b instanceof L?b:new L(b),d=a,e;null!==(e=J(c));)d=new ih(e,d,x(d.A.children,e)||new hh),c=D(c);return d}g=ih.prototype;g.Ea=function(){return this.A.value};function kh(a,b){H("undefined"!==typeof b,"Cannot set value to undefined");a.A.value=b;lh(a)}g.clear=function(){this.A.value=null;this.A.children={};this.A.ad=0;lh(this)};
g.kd=function(){return 0<this.A.ad};g.e=function(){return null===this.Ea()&&!this.kd()};g.P=function(a){var b=this;t(this.A.children,function(c,d){a(new ih(d,b,c))})};function mh(a,b,c,d){c&&!d&&b(a);a.P(function(a){mh(a,b,!0,d)});c&&d&&b(a)}function nh(a,b){for(var c=a.parent();null!==c&&!b(c);)c=c.parent()}g.path=function(){return new L(null===this.Ha?this.ud:this.Ha.path()+"/"+this.ud)};g.name=function(){return this.ud};g.parent=function(){return this.Ha};
function lh(a){if(null!==a.Ha){var b=a.Ha,c=a.ud,d=a.e(),e=Bb(b.A.children,c);d&&e?(delete b.A.children[c],b.A.ad--,lh(b)):d||e||(b.A.children[c]=a.A,b.A.ad++,lh(b))}};function oh(a,b,c,d,e,f){this.id=ph++;this.f=Yc("p:"+this.id+":");this.qd={};this.aa={};this.qa=[];this.Pc=0;this.Lc=[];this.na=!1;this.Va=1E3;this.td=3E5;this.Hb=b;this.Kc=c;this.ue=d;this.M=a;this.pb=this.Ia=this.Db=this.ze=null;this.Vd=e;this.de=!1;this.ke=0;if(f)throw Error("Auth override specified in options, but not supported on non Node.js platforms");this.Je=f||null;this.vb=null;this.Nb=!1;this.Gd={};this.tg=0;this.Ve=!0;this.Bc=this.me=null;qh(this,0);Tf.Wb().hc("visible",this.jg,this);-1===
a.host.indexOf("fblocal")&&Sf.Wb().hc("online",this.ig,this)}var ph=0,rh=0;g=oh.prototype;g.va=function(a,b,c){var d=++this.tg;a={r:d,a:a,b:b};this.f(B(a));H(this.na,"sendRequest call when we're not connected not allowed.");this.Ia.va(a);c&&(this.Gd[d]=c)};
g.df=function(a,b,c,d){var e=a.ka(),f=a.path.toString();this.f("Listen called for "+f+" "+e);this.aa[f]=this.aa[f]||{};H(rd(a.n)||!S(a.n),"listen() called for non-default but complete query");H(!this.aa[f][e],"listen() called twice for same path/queryId.");a={G:d,ld:b,pg:a,tag:c};this.aa[f][e]=a;this.na&&sh(this,a)};
function sh(a,b){var c=b.pg,d=c.path.toString(),e=c.ka();a.f("Listen on "+d+" for "+e);var f={p:d};b.tag&&(f.q=Ie(c.n),f.t=b.tag);f.h=b.ld();a.va("q",f,function(f){var k=f.d,m=f.s;if(k&&"object"===typeof k&&Bb(k,"w")){var l=x(k,"w");da(l)&&0<=Ia(l,"no_index")&&O("Using an unspecified index. Consider adding "+('".indexOn": "'+c.n.g.toString()+'"')+" at "+c.path.toString()+" to your security rules for better performance")}(a.aa[d]&&a.aa[d][e])===b&&(a.f("listen response",f),"ok"!==m&&th(a,d,e),b.G&&
b.G(m,k))})}g.qf=function(a){this.pb=a;this.f("Auth token refreshed");this.pb?uh(this):this.na&&this.va("unauth",{},function(){});if(a&&40===a.length||od(a))this.f("Admin auth credential detected.  Reducing max reconnect time."),this.td=3E4};function uh(a){if(a.na&&a.pb){var b=a.pb,c=nd(b)?"auth":"gauth",d={cred:b};a.Je&&(d.authvar=a.Je);a.va(c,d,function(c){var d=c.s;c=c.d||"error";a.pb===b&&("ok"===d?a.ke=0:vh(a,d,c))})}}
g.Ef=function(a,b){var c=a.path.toString(),d=a.ka();this.f("Unlisten called for "+c+" "+d);H(rd(a.n)||!S(a.n),"unlisten() called for non-default but complete query");if(th(this,c,d)&&this.na){var e=Ie(a.n);this.f("Unlisten on "+c+" for "+d);c={p:c};b&&(c.q=e,c.t=b);this.va("n",c)}};g.re=function(a,b,c){this.na?wh(this,"o",a,b,c):this.Lc.push({we:a,action:"o",data:b,G:c})};g.gf=function(a,b,c){this.na?wh(this,"om",a,b,c):this.Lc.push({we:a,action:"om",data:b,G:c})};
g.xd=function(a,b){this.na?wh(this,"oc",a,null,b):this.Lc.push({we:a,action:"oc",data:null,G:b})};function wh(a,b,c,d,e){c={p:c,d:d};a.f("onDisconnect "+b,c);a.va(b,c,function(a){e&&setTimeout(function(){e(a.s,a.d)},Math.floor(0))})}g.put=function(a,b,c,d){xh(this,"p",a,b,c,d)};g.ef=function(a,b,c,d){xh(this,"m",a,b,c,d)};function xh(a,b,c,d,e,f){d={p:c,d:d};p(f)&&(d.h=f);a.qa.push({action:b,sf:d,G:e});a.Pc++;b=a.qa.length-1;a.na?yh(a,b):a.f("Buffering put: "+c)}
function yh(a,b){var c=a.qa[b].action,d=a.qa[b].sf,e=a.qa[b].G;a.qa[b].qg=a.na;a.va(c,d,function(d){a.f(c+" response",d);delete a.qa[b];a.Pc--;0===a.Pc&&(a.qa=[]);e&&e(d.s,d.d)})}g.ye=function(a){this.na&&(a={c:a},this.f("reportStats",a),this.va("s",a,function(a){"ok"!==a.s&&this.f("reportStats","Error sending stats: "+a.d)}))};
g.wd=function(a){if("r"in a){this.f("from server: "+B(a));var b=a.r,c=this.Gd[b];c&&(delete this.Gd[b],c(a.b))}else{if("error"in a)throw"A server-side error has occurred: "+a.error;"a"in a&&(b=a.a,a=a.b,this.f("handleServerMessage",b,a),"d"===b?this.Hb(a.p,a.d,!1,a.t):"m"===b?this.Hb(a.p,a.d,!0,a.t):"c"===b?zh(this,a.p,a.q):"ac"===b?vh(this,a.s,a.d):"sd"===b?this.ze?this.ze(a):"msg"in a&&"undefined"!==typeof console&&console.log("FIREBASE: "+a.msg.replace("\n","\nFIREBASE: ")):Zc("Unrecognized action received from server: "+
B(b)+"\nAre you using the latest client?"))}};g.Mc=function(a,b){this.f("connection ready");this.na=!0;this.Bc=(new Date).getTime();this.ue({serverTimeOffset:a-(new Date).getTime()});this.Db=b;if(this.Ve){var c={};c["sdk.js."+firebase.SDK_VERSION.replace(/\./g,"-")]=1;Qb()?c["framework.cordova"]=1:"object"===typeof navigator&&"ReactNative"===navigator.product&&(c["framework.reactnative"]=1);this.ye(c)}Ah(this);this.Ve=!1;this.Kc(!0)};
function qh(a,b){H(!a.Ia,"Scheduling a connect when we're already connected/ing?");a.vb&&clearTimeout(a.vb);a.vb=setTimeout(function(){a.vb=null;Bh(a)},Math.floor(b))}g.jg=function(a){a&&!this.Nb&&this.Va===this.td&&(this.f("Window became visible.  Reducing delay."),this.Va=1E3,this.Ia||qh(this,0));this.Nb=a};g.ig=function(a){a?(this.f("Browser went online."),this.Va=1E3,this.Ia||qh(this,0)):(this.f("Browser went offline.  Killing connection."),this.Ia&&this.Ia.close())};
g.jf=function(){this.f("data client disconnected");this.na=!1;this.Ia=null;for(var a=0;a<this.qa.length;a++){var b=this.qa[a];b&&"h"in b.sf&&b.qg&&(b.G&&b.G("disconnect"),delete this.qa[a],this.Pc--)}0===this.Pc&&(this.qa=[]);this.Gd={};Ch(this)&&(this.Nb?this.Bc&&(3E4<(new Date).getTime()-this.Bc&&(this.Va=1E3),this.Bc=null):(this.f("Window isn't visible.  Delaying reconnect."),this.Va=this.td,this.me=(new Date).getTime()),a=Math.max(0,this.Va-((new Date).getTime()-this.me)),a*=Math.random(),this.f("Trying to reconnect in "+
a+"ms"),qh(this,a),this.Va=Math.min(this.td,1.3*this.Va));this.Kc(!1)};
function Bh(a){if(Ch(a)){a.f("Making a connection attempt");a.me=(new Date).getTime();a.Bc=null;var b=r(a.wd,a),c=r(a.Mc,a),d=r(a.jf,a),e=a.id+":"+rh++,f=a.Db,h=!1,k=null,m=function(){k?k.close():(h=!0,d())};a.Ia={close:m,va:function(a){H(k,"sendRequest call when we're not connected not allowed.");k.va(a)}};var l=a.de;a.de=!1;a.Vd.getToken(l).then(function(l){h?E("getToken() completed but was canceled"):(E("getToken() completed. Creating connection."),a.pb=l&&l.accessToken,k=new bf(e,a.M,b,c,d,function(b){O(b+
" ("+a.M.toString()+")");a.eb("server_kill")},f))}).then(null,function(b){a.f("Failed to get token: "+b);h||m()})}}g.eb=function(a){E("Interrupting connection for reason: "+a);this.qd[a]=!0;this.Ia?this.Ia.close():(this.vb&&(clearTimeout(this.vb),this.vb=null),this.na&&this.jf())};g.lc=function(a){E("Resuming connection for reason: "+a);delete this.qd[a];xa(this.qd)&&(this.Va=1E3,this.Ia||qh(this,0))};
function zh(a,b,c){c=c?La(c,function(a){return fd(a)}).join("$"):"default";(a=th(a,b,c))&&a.G&&a.G("permission_denied")}function th(a,b,c){b=(new L(b)).toString();var d;p(a.aa[b])?(d=a.aa[b][c],delete a.aa[b][c],0===qa(a.aa[b])&&delete a.aa[b]):d=void 0;return d}
function vh(a,b,c){E("Auth token revoked: "+b+"/"+c);a.pb=null;a.de=!0;a.Ia.close();"invalid_token"===b&&(a.ke++,3<=a.ke&&(a.Va=3E4,O("Provided authentication credentials are invalid. This usually indicates your FirebaseApp instance was not initialized correctly. Make sure your apiKey and databaseURL match the values provided for your app at https://console.firebase.google.com/, or if you're using a service account, make sure it's authorized to access the specified databaseURL and is from the correct project.")))}
function Ah(a){uh(a);t(a.aa,function(b){t(b,function(b){sh(a,b)})});for(var b=0;b<a.qa.length;b++)a.qa[b]&&yh(a,b);for(;a.Lc.length;)b=a.Lc.shift(),wh(a,b.action,b.we,b.data,b.G)}function Ch(a){var b;b=Sf.Wb().ic;return xa(a.qd)&&b};var Y={Xf:function(){Re=Ed=!0}};Y.forceLongPolling=Y.Xf;Y.Yf=function(){Se=!0};Y.forceWebSockets=Y.Yf;Y.dg=function(){return Dd.isAvailable()};Y.isWebSocketsAvailable=Y.dg;Y.wg=function(a,b){a.u.Ua.ze=b};Y.setSecurityDebugCallback=Y.wg;Y.Be=function(a,b){a.u.Be(b)};Y.stats=Y.Be;Y.Ce=function(a,b){a.u.Ce(b)};Y.statsIncrementCounter=Y.Ce;Y.ed=function(a){return a.u.ed};Y.dataUpdateCount=Y.ed;Y.cg=function(a,b){a.u.je=b};Y.interceptServerData=Y.cg;function Dh(a){this.xa=Q;this.lb=new bh;this.De={};this.jc={};this.Dc=a}function Eh(a,b,c,d,e){var f=a.lb,h=e;H(d>f.Cc,"Stacking an older write on top of newer ones");p(h)||(h=!0);f.ma.push({path:b,Ja:c,Zc:d,visible:h});h&&(f.T=Sg(f.T,b,c));f.Cc=d;return e?Fh(a,new $b(Ng,b,c)):[]}function Gh(a,b,c,d){var e=a.lb;H(d>e.Cc,"Stacking an older merge on top of newer ones");e.ma.push({path:b,children:c,Zc:d,visible:!0});e.T=Tg(e.T,b,c);e.Cc=d;c=Bg(c);return Fh(a,new vd(Ng,b,c))}
function Hh(a,b,c){c=c||!1;var d=ch(a.lb,b);if(a.lb.Ed(b)){var e=Q;null!=d.Ja?e=e.set(C,!0):Cb(d.children,function(a,b){e=e.set(new L(a),b)});return Fh(a,new Mg(d.path,e,c))}return[]}function Ih(a,b,c){c=Bg(c);return Fh(a,new vd(Pg,b,c))}function Jh(a,b,c,d){d=Kh(a,d);if(null!=d){var e=Lh(d);d=e.path;e=e.Ib;b=T(d,b);c=new $b(new Og(!1,!0,e,!0),b,c);return Mh(a,d,c)}return[]}
function Nh(a,b,c,d){if(d=Kh(a,d)){var e=Lh(d);d=e.path;e=e.Ib;b=T(d,b);c=Bg(c);c=new vd(new Og(!1,!0,e,!0),b,c);return Mh(a,d,c)}return[]}
Dh.prototype.Ob=function(a,b){var c=a.path,d=null,e=!1;Ig(this.xa,c,function(a,b){var f=T(a,c);d=d||b.jb(f);e=e||null!=Zg(b)});var f=this.xa.get(c);f?(e=e||null!=Zg(f),d=d||f.jb(C)):(f=new Yg,this.xa=this.xa.set(c,f));var h;null!=d?h=!0:(h=!1,d=F,Lg(this.xa.subtree(c),function(a,b){var c=b.jb(C);c&&(d=d.U(a,c))}));var k=null!=ah(f,a);if(!k&&!S(a.n)){var m=Oh(a);H(!(m in this.jc),"View does not exist, but we have a tag");var l=Ph++;this.jc[m]=l;this.De["_"+l]=m}h=f.Ob(a,b,new gh(c,this.lb),d,h);k||
e||(f=ah(f,a),h=h.concat(Qh(this,a,f)));return h};
Dh.prototype.mb=function(a,b,c){var d=a.path,e=this.xa.get(d),f=[];if(e&&("default"===a.ka()||null!=ah(e,a))){f=e.mb(a,b,c);e.e()&&(this.xa=this.xa.remove(d));e=f.sg;f=f.Tf;b=-1!==Pa(e,function(a){return S(a.n)});var h=Gg(this.xa,d,function(a,b){return null!=Zg(b)});if(b&&!h&&(d=this.xa.subtree(d),!d.e()))for(var d=Rh(d),k=0;k<d.length;++k){var m=d[k],l=m.W,m=Sh(this,m);this.Dc.Ae(Th(l),Uh(this,l),m.ld,m.G)}if(!h&&0<e.length&&!c)if(b)this.Dc.Od(Th(a),null);else{var u=this;Ja(e,function(a){a.ka();
var b=u.jc[Oh(a)];u.Dc.Od(Th(a),b)})}Vh(this,e)}return f};Dh.prototype.Ba=function(a,b){var c=this.lb,d=Gg(this.xa,a,function(b,c){var d=T(b,a);if(d=c.jb(d))return d});return c.Ba(a,d,b,!0)};function Rh(a){return Eg(a,function(a,c,d){if(c&&null!=Zg(c))return[Zg(c)];var e=[];c&&(e=$g(c));t(d,function(a){e=e.concat(a)});return e})}function Vh(a,b){for(var c=0;c<b.length;++c){var d=b[c];if(!S(d.n)){var d=Oh(d),e=a.jc[d];delete a.jc[d];delete a.De["_"+e]}}}
function Th(a){return S(a.n)&&!rd(a.n)?a.xb():a}function Qh(a,b,c){var d=b.path,e=Uh(a,b);c=Sh(a,c);b=a.Dc.Ae(Th(b),e,c.ld,c.G);d=a.xa.subtree(d);if(e)H(null==Zg(d.value),"If we're adding a query, it shouldn't be shadowed");else for(e=Eg(d,function(a,b,c){if(!a.e()&&b&&null!=Zg(b))return[pg(Zg(b))];var d=[];b&&(d=d.concat(La($g(b),function(a){return a.W})));t(c,function(a){d=d.concat(a)});return d}),d=0;d<e.length;++d)c=e[d],a.Dc.Od(Th(c),Uh(a,c));return b}
function Sh(a,b){var c=b.W,d=Uh(a,c);return{ld:function(){return(b.w()||F).hash()},G:function(b){if("ok"===b){if(d){var f=c.path;if(b=Kh(a,d)){var h=Lh(b);b=h.path;h=h.Ib;f=T(b,f);f=new bc(new Og(!1,!0,h,!0),f);b=Mh(a,b,f)}else b=[]}else b=Fh(a,new bc(Pg,c.path));return b}f="Unknown Error";"too_big"===b?f="The data requested exceeds the maximum size that can be accessed with a single request.":"permission_denied"==b?f="Client doesn't have permission to access the desired data.":"unavailable"==b&&
(f="The service is unavailable");f=Error(b+" at "+c.path.toString()+": "+f);f.code=b.toUpperCase();return a.mb(c,null,f)}}}function Oh(a){return a.path.toString()+"$"+a.ka()}function Lh(a){var b=a.indexOf("$");H(-1!==b&&b<a.length-1,"Bad queryKey.");return{Ib:a.substr(b+1),path:new L(a.substr(0,b))}}function Kh(a,b){var c=a.De,d="_"+b;return d in c?c[d]:void 0}function Uh(a,b){var c=Oh(b);return x(a.jc,c)}var Ph=1;
function Mh(a,b,c){var d=a.xa.get(b);H(d,"Missing sync point for query tag that we're tracking");return d.gb(c,new gh(b,a.lb),null)}function Fh(a,b){return Wh(a,b,a.xa,null,new gh(C,a.lb))}function Wh(a,b,c,d,e){if(b.path.e())return Xh(a,b,c,d,e);var f=c.get(C);null==d&&null!=f&&(d=f.jb(C));var h=[],k=J(b.path),m=b.Nc(k);if((c=c.children.get(k))&&m)var l=d?d.R(k):null,k=e.k(k),h=h.concat(Wh(a,m,c,l,k));f&&(h=h.concat(f.gb(b,e,d)));return h}
function Xh(a,b,c,d,e){var f=c.get(C);null==d&&null!=f&&(d=f.jb(C));var h=[];c.children.ia(function(c,f){var l=d?d.R(c):null,u=e.k(c),z=b.Nc(c);z&&(h=h.concat(Xh(a,z,f,l,u)))});f&&(h=h.concat(f.gb(b,e,d)));return h};function tf(a,b,c){this.app=c;var d=new dc(c);this.M=a;this.Xa=Ad(a);this.Vc=null;this.da=new mc;this.vd=1;this.Ua=null;if(b||0<=("object"===typeof window&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i))this.wa=new pd(this.M,r(this.Hb,this),d),setTimeout(r(this.Kc,this,!0),0);else{b=c.options.databaseAuthVariableOverride||null;if(null!==b){if("object"!==ca(b))throw Error("Only objects are supported for option databaseAuthVariableOverride");
try{B(b)}catch(e){throw Error("Invalid authOverride provided: "+e);}}this.wa=this.Ua=new oh(this.M,r(this.Hb,this),r(this.Kc,this),r(this.ue,this),d,b)}var f=this;ec(d,function(a){f.wa.qf(a)});this.zg=Bd(a,r(function(){return new xd(this.Xa,this.wa)},this));this.nc=new ih;this.ie=new fc;this.pd=new Dh({Ae:function(a,b,c,d){b=[];c=f.ie.j(a.path);c.e()||(b=Fh(f.pd,new $b(Pg,a.path,c)),setTimeout(function(){d("ok")},0));return b},Od:aa});Yh(this,"connected",!1);this.ja=new Mc;this.$a=new sf(this);this.ed=
0;this.je=null;this.K=new Dh({Ae:function(a,b,c,d){f.wa.df(a,c,b,function(b,c){var e=d(b,c);rc(f.da,a.path,e)});return[]},Od:function(a,b){f.wa.Ef(a,b)}})}g=tf.prototype;g.toString=function(){return(this.M.Sc?"https://":"http://")+this.M.host};g.name=function(){return this.M.pe};function Zh(a){a=a.ie.j(new L(".info/serverTimeOffset")).H()||0;return(new Date).getTime()+a}function $h(a){a=a={timestamp:Zh(a)};a.timestamp=a.timestamp||(new Date).getTime();return a}
g.Hb=function(a,b,c,d){this.ed++;var e=new L(a);b=this.je?this.je(a,b):b;a=[];d?c?(b=oa(b,function(a){return M(a)}),a=Nh(this.K,e,b,d)):(b=M(b),a=Jh(this.K,e,b,d)):c?(d=oa(b,function(a){return M(a)}),a=Ih(this.K,e,d)):(d=M(b),a=Fh(this.K,new $b(Pg,e,d)));d=e;0<a.length&&(d=ai(this,e));rc(this.da,d,a)};g.Kc=function(a){Yh(this,"connected",a);!1===a&&bi(this)};g.ue=function(a){var b=this;hd(a,function(a,d){Yh(b,d,a)})};
function Yh(a,b,c){b=new L("/.info/"+b);c=M(c);var d=a.ie;d.Jd=d.Jd.F(b,c);c=Fh(a.pd,new $b(Pg,b,c));rc(a.da,b,c)}g.Kb=function(a,b,c,d){this.f("set",{path:a.toString(),value:b,Gg:c});var e=$h(this);b=M(b,c);var e=Pc(b,e),f=this.vd++,e=Eh(this.K,a,e,f,!0);nc(this.da,e);var h=this;this.wa.put(a.toString(),b.H(!0),function(b,c){var e="ok"===b;e||O("set at "+a+" failed: "+b);e=Hh(h.K,f,!e);rc(h.da,a,e);ci(d,b,c)});e=di(this,a);ai(this,e);rc(this.da,e,[])};
g.update=function(a,b,c){this.f("update",{path:a.toString(),value:b});var d=!0,e=$h(this),f={};t(b,function(a,b){d=!1;var c=M(a);f[b]=Pc(c,e)});if(d)E("update() called with empty data.  Don't do anything."),ci(c,"ok");else{var h=this.vd++,k=Gh(this.K,a,f,h);nc(this.da,k);var m=this;this.wa.ef(a.toString(),b,function(b,d){var e="ok"===b;e||O("update at "+a+" failed: "+b);var e=Hh(m.K,h,!e),f=a;0<e.length&&(f=ai(m,a));rc(m.da,f,e);ci(c,b,d)});t(b,function(b,c){var d=di(m,a.k(c));ai(m,d)});rc(this.da,
a,[])}};function bi(a){a.f("onDisconnectEvents");var b=$h(a),c=[];Nc(Lc(a.ja,b),C,function(b,e){c=c.concat(Fh(a.K,new $b(Pg,b,e)));var f=di(a,b);ai(a,f)});a.ja=new Mc;rc(a.da,C,c)}g.xd=function(a,b){var c=this;this.wa.xd(a.toString(),function(d,e){"ok"===d&&zf(c.ja,a);ci(b,d,e)})};function Nf(a,b,c,d){var e=M(c);a.wa.re(b.toString(),e.H(!0),function(c,h){"ok"===c&&Oc(a.ja,b,e);ci(d,c,h)})}
function Of(a,b,c,d,e){var f=M(c,d);a.wa.re(b.toString(),f.H(!0),function(c,d){"ok"===c&&Oc(a.ja,b,f);ci(e,c,d)})}function Pf(a,b,c,d){var e=!0,f;for(f in c)e=!1;e?(E("onDisconnect().update() called with empty data.  Don't do anything."),ci(d,"ok")):a.wa.gf(b.toString(),c,function(e,f){if("ok"===e)for(var m in c){var l=M(c[m]);Oc(a.ja,b.k(m),l)}ci(d,e,f)})}function yg(a,b,c){c=".info"===J(b.path)?a.pd.Ob(b,c):a.K.Ob(b,c);pc(a.da,b.path,c)}g.eb=function(){this.Ua&&this.Ua.eb("repo_interrupt")};
g.lc=function(){this.Ua&&this.Ua.lc("repo_interrupt")};g.Be=function(a){if("undefined"!==typeof console){a?(this.Vc||(this.Vc=new lc(this.Xa)),a=this.Vc.get()):a=this.Xa.get();var b=Ma(ta(a),function(a,b){return Math.max(b.length,a)},0),c;for(c in a){for(var d=a[c],e=c.length;e<b+2;e++)c+=" ";console.log(c+d)}}};g.Ce=function(a){kc(this.Xa,a);this.zg.zf[a]=!0};g.f=function(a){var b="";this.Ua&&(b=this.Ua.id+":");E(b,arguments)};
function ci(a,b,c){a&&Ub(function(){if("ok"==b)a(null);else{var d=(b||"error").toUpperCase(),e=d;c&&(e+=": "+c);e=Error(e);e.code=d;a(e)}})};function ei(a,b,c,d,e){function f(){}a.f("transaction on "+b);var h=new U(a,b);h.hc("value",f);c={path:b,update:c,G:d,status:null,lf:Rc(),Ie:e,wf:0,Rd:function(){h.Jc("value",f)},Td:null,Da:null,bd:null,cd:null,dd:null};d=a.K.Ba(b,void 0)||F;c.bd=d;d=c.update(d.H());if(p(d)){Ff("transaction failed: Data returned ",d,c.path);c.status=1;e=jh(a.nc,b);var k=e.Ea()||[];k.push(c);kh(e,k);"object"===typeof d&&null!==d&&Bb(d,".priority")?(k=x(d,".priority"),H(Df(k),"Invalid priority returned by transaction. Priority must be a valid string, finite number, server value, or null.")):
k=(a.K.Ba(b)||F).C().H();e=$h(a);d=M(d,k);e=Pc(d,e);c.cd=d;c.dd=e;c.Da=a.vd++;c=Eh(a.K,b,e,c.Da,c.Ie);rc(a.da,b,c);fi(a)}else c.Rd(),c.cd=null,c.dd=null,c.G&&(a=new W(c.bd,new U(a,c.path),N),c.G(null,!1,a))}function fi(a,b){var c=b||a.nc;b||gi(a,c);if(null!==c.Ea()){var d=hi(a,c);H(0<d.length,"Sending zero length transaction queue");Na(d,function(a){return 1===a.status})&&ii(a,c.path(),d)}else c.kd()&&c.P(function(b){fi(a,b)})}
function ii(a,b,c){for(var d=La(c,function(a){return a.Da}),e=a.K.Ba(b,d)||F,d=e,e=e.hash(),f=0;f<c.length;f++){var h=c[f];H(1===h.status,"tryToSendTransactionQueue_: items in queue should all be run.");h.status=2;h.wf++;var k=T(b,h.path),d=d.F(k,h.cd)}d=d.H(!0);a.wa.put(b.toString(),d,function(d){a.f("transaction put response",{path:b.toString(),status:d});var e=[];if("ok"===d){d=[];for(f=0;f<c.length;f++){c[f].status=3;e=e.concat(Hh(a.K,c[f].Da));if(c[f].G){var h=c[f].dd,k=new U(a,c[f].path);d.push(r(c[f].G,
null,null,!0,new W(h,k,N)))}c[f].Rd()}gi(a,jh(a.nc,b));fi(a);rc(a.da,b,e);for(f=0;f<d.length;f++)Ub(d[f])}else{if("datastale"===d)for(f=0;f<c.length;f++)c[f].status=4===c[f].status?5:1;else for(O("transaction at "+b.toString()+" failed: "+d),f=0;f<c.length;f++)c[f].status=5,c[f].Td=d;ai(a,b)}},e)}function ai(a,b){var c=ji(a,b),d=c.path(),c=hi(a,c);ki(a,c,d);return d}
function ki(a,b,c){if(0!==b.length){for(var d=[],e=[],f=Ka(b,function(a){return 1===a.status}),f=La(f,function(a){return a.Da}),h=0;h<b.length;h++){var k=b[h],m=T(c,k.path),l=!1,u;H(null!==m,"rerunTransactionsUnderNode_: relativePath should not be null.");if(5===k.status)l=!0,u=k.Td,e=e.concat(Hh(a.K,k.Da,!0));else if(1===k.status)if(25<=k.wf)l=!0,u="maxretry",e=e.concat(Hh(a.K,k.Da,!0));else{var z=a.K.Ba(k.path,f)||F;k.bd=z;var G=b[h].update(z.H());p(G)?(Ff("transaction failed: Data returned ",G,
k.path),m=M(G),"object"===typeof G&&null!=G&&Bb(G,".priority")||(m=m.ga(z.C())),z=k.Da,G=$h(a),G=Pc(m,G),k.cd=m,k.dd=G,k.Da=a.vd++,Qa(f,z),e=e.concat(Eh(a.K,k.path,G,k.Da,k.Ie)),e=e.concat(Hh(a.K,z,!0))):(l=!0,u="nodata",e=e.concat(Hh(a.K,k.Da,!0)))}rc(a.da,c,e);e=[];l&&(b[h].status=3,setTimeout(b[h].Rd,Math.floor(0)),b[h].G&&("nodata"===u?(k=new U(a,b[h].path),d.push(r(b[h].G,null,null,!1,new W(b[h].bd,k,N)))):d.push(r(b[h].G,null,Error(u),!1,null))))}gi(a,a.nc);for(h=0;h<d.length;h++)Ub(d[h]);fi(a)}}
function ji(a,b){for(var c,d=a.nc;null!==(c=J(b))&&null===d.Ea();)d=jh(d,c),b=D(b);return d}function hi(a,b){var c=[];li(a,b,c);c.sort(function(a,b){return a.lf-b.lf});return c}function li(a,b,c){var d=b.Ea();if(null!==d)for(var e=0;e<d.length;e++)c.push(d[e]);b.P(function(b){li(a,b,c)})}function gi(a,b){var c=b.Ea();if(c){for(var d=0,e=0;e<c.length;e++)3!==c[e].status&&(c[d]=c[e],d++);c.length=d;kh(b,0<c.length?c:null)}b.P(function(b){gi(a,b)})}
function di(a,b){var c=ji(a,b).path(),d=jh(a.nc,b);nh(d,function(b){mi(a,b)});mi(a,d);mh(d,function(b){mi(a,b)});return c}
function mi(a,b){var c=b.Ea();if(null!==c){for(var d=[],e=[],f=-1,h=0;h<c.length;h++)4!==c[h].status&&(2===c[h].status?(H(f===h-1,"All SENT items should be at beginning of queue."),f=h,c[h].status=4,c[h].Td="set"):(H(1===c[h].status,"Unexpected transaction status in abort"),c[h].Rd(),e=e.concat(Hh(a.K,c[h].Da,!0)),c[h].G&&d.push(r(c[h].G,null,Error("set"),!1,null))));-1===f?kh(b,null):c.length=f+1;rc(a.da,b.path(),e);for(h=0;h<d.length;h++)Ub(d[h])}};function yf(){this.nb={};this.Ff=!1}yf.prototype.eb=function(){for(var a in this.nb)this.nb[a].eb()};yf.prototype.lc=function(){for(var a in this.nb)this.nb[a].lc()};yf.prototype.ce=function(a){this.Ff=a};ba(yf);yf.prototype.interrupt=yf.prototype.eb;yf.prototype.resume=yf.prototype.lc;var Z={};Z.pc=oh;Z.DataConnection=Z.pc;oh.prototype.yg=function(a,b){this.va("q",{p:a},b)};Z.pc.prototype.simpleListen=Z.pc.prototype.yg;oh.prototype.Qf=function(a,b){this.va("echo",{d:a},b)};Z.pc.prototype.echo=Z.pc.prototype.Qf;oh.prototype.interrupt=oh.prototype.eb;Z.If=bf;Z.RealTimeConnection=Z.If;bf.prototype.sendRequest=bf.prototype.va;bf.prototype.close=bf.prototype.close;
Z.bg=function(a){var b=oh.prototype.put;oh.prototype.put=function(c,d,e,f){p(f)&&(f=a());b.call(this,c,d,e,f)};return function(){oh.prototype.put=b}};Z.hijackHash=Z.bg;Z.Hf=gc;Z.ConnectionTarget=Z.Hf;Z.ka=function(a){return a.ka()};Z.queryIdentifier=Z.ka;Z.eg=function(a){return a.u.Ua.aa};Z.listens=Z.eg;Z.ce=function(a){yf.Wb().ce(a)};Z.forceRestClient=Z.ce;Z.Context=yf;function U(a,b){if(!(a instanceof tf))throw Error("new Firebase() no longer supported - use app.database().");X.call(this,a,b,Fe,!1);this.then=void 0;this["catch"]=void 0}ka(U,X);g=U.prototype;g.getKey=function(){y("Firebase.key",0,0,arguments.length);return this.path.e()?null:ae(this.path)};
g.k=function(a){y("Firebase.child",1,1,arguments.length);if(fa(a))a=String(a);else if(!(a instanceof L))if(null===J(this.path)){var b=a;b&&(b=b.replace(/^\/*\.info(\/|$)/,"/"));Lf("Firebase.child",b)}else Lf("Firebase.child",a);return new U(this.u,this.path.k(a))};g.getParent=function(){y("Firebase.parent",0,0,arguments.length);var a=this.path.parent();return null===a?null:new U(this.u,a)};
g.Zf=function(){y("Firebase.ref",0,0,arguments.length);for(var a=this;null!==a.getParent();)a=a.getParent();return a};g.Pf=function(){return this.u.$a};g.set=function(a,b){y("Firebase.set",1,2,arguments.length);Mf("Firebase.set",this.path);Ef("Firebase.set",a,this.path,!1);A("Firebase.set",2,b,!0);var c=new Hb;this.u.Kb(this.path,a,null,Ib(c,b));return c.sa};
g.update=function(a,b){y("Firebase.update",1,2,arguments.length);Mf("Firebase.update",this.path);if(da(a)){for(var c={},d=0;d<a.length;++d)c[""+d]=a[d];a=c;O("Passing an Array to Firebase.update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.")}Hf("Firebase.update",a,this.path);A("Firebase.update",2,b,!0);c=new Hb;this.u.update(this.path,a,Ib(c,b));return c.sa};
g.Kb=function(a,b,c){y("Firebase.setWithPriority",2,3,arguments.length);Mf("Firebase.setWithPriority",this.path);Ef("Firebase.setWithPriority",a,this.path,!1);If("Firebase.setWithPriority",2,b);A("Firebase.setWithPriority",3,c,!0);if(".length"===this.getKey()||".keys"===this.getKey())throw"Firebase.setWithPriority failed: "+this.getKey()+" is a read-only object.";var d=new Hb;this.u.Kb(this.path,a,b,Ib(d,c));return d.sa};
g.remove=function(a){y("Firebase.remove",0,1,arguments.length);Mf("Firebase.remove",this.path);A("Firebase.remove",1,a,!0);return this.set(null,a)};
g.transaction=function(a,b,c){y("Firebase.transaction",1,3,arguments.length);Mf("Firebase.transaction",this.path);A("Firebase.transaction",1,a,!1);A("Firebase.transaction",2,b,!0);if(p(c)&&"boolean"!=typeof c)throw Error(Db("Firebase.transaction",3,!0)+"must be a boolean.");if(".length"===this.getKey()||".keys"===this.getKey())throw"Firebase.transaction failed: "+this.getKey()+" is a read-only object.";"undefined"===typeof c&&(c=!0);var d=new Hb;ga(b)&&Jb(d.sa);ei(this.u,this.path,a,function(a,c,
h){a?d.reject(a):d.resolve(new Pb(c,h));ga(b)&&b(a,c,h)},c);return d.sa};g.vg=function(a,b){y("Firebase.setPriority",1,2,arguments.length);Mf("Firebase.setPriority",this.path);If("Firebase.setPriority",1,a);A("Firebase.setPriority",2,b,!0);var c=new Hb;this.u.Kb(this.path.k(".priority"),a,null,Ib(c,b));return c.sa};
g.push=function(a,b){y("Firebase.push",0,2,arguments.length);Mf("Firebase.push",this.path);Ef("Firebase.push",a,this.path,!0);A("Firebase.push",2,b,!0);var c=Zh(this.u),d=Uf(c),c=this.k(d);if(null!=a){var e=this,f=c.set(a,b).then(function(){return e.k(d)});c.then=r(f.then,f);c["catch"]=r(f.then,f,void 0);ga(b)&&Jb(f)}return c};g.kb=function(){Mf("Firebase.onDisconnect",this.path);return new V(this.u,this.path)};U.prototype.child=U.prototype.k;U.prototype.set=U.prototype.set;U.prototype.update=U.prototype.update;
U.prototype.setWithPriority=U.prototype.Kb;U.prototype.remove=U.prototype.remove;U.prototype.transaction=U.prototype.transaction;U.prototype.setPriority=U.prototype.vg;U.prototype.push=U.prototype.push;U.prototype.onDisconnect=U.prototype.kb;kd(U.prototype,"database",U.prototype.Pf);kd(U.prototype,"key",U.prototype.getKey);kd(U.prototype,"parent",U.prototype.getParent);kd(U.prototype,"root",U.prototype.Zf);if("undefined"===typeof firebase)throw Error("Cannot install Firebase Database - be sure to load firebase-app.js first.");
try{firebase.INTERNAL.registerService("database",function(a){var b=yf.Wb(),c=a.options.databaseURL;p(c)||$c("Can't determine Firebase Database URL.  Be sure to include databaseURL option when calling firebase.intializeApp().");var d=ad(c),c=d.kc;xf("Invalid Firebase Database URL",d);d.path.e()||$c("Database URL must point to the root of a Firebase Database (not including a child path).");(d=x(b.nb,a.name))&&$c("FIREBASE INTERNAL ERROR: Database initialized multiple times.");d=new tf(c,b.Ff,a);b.nb[a.name]=
d;return d.$a},{Reference:U,Query:X,Database:sf,enableLogging:Xc,INTERNAL:Y,TEST_ACCESS:Z,ServerValue:vf})}catch(ni){$c("Failed to register the Firebase Database Service ("+ni+")")};})();

module.exports = firebase.database;

},{"./app":4}],7:[function(require,module,exports){
/**
 *  Firebase libraries for browser - npm package.
 *
 * Usage:
 *
 *   firebase = require('firebase');
 */
var firebase = require('./app');
require('./auth');
require('./database');
require('./storage');
require('./messaging');
module.exports = firebase;

},{"./app":4,"./auth":5,"./database":6,"./messaging":8,"./storage":9}],8:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};var firebase = require('./app');
/*! @license Firebase v3.5.2
    Build: 3.5.2-rc.1
    Terms: https://developers.google.com/terms */
(function() {var f=function(a,b){function c(){}c.prototype=b.prototype;a.prototype=new c;for(var d in b)if(Object.defineProperties){var e=Object.getOwnPropertyDescriptor(b,d);e&&Object.defineProperty(a,d,e)}else a[d]=b[d]},h="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(c.get||c.set)throw new TypeError("ES3 does not support getters and setters.");a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)},k="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global&&
null!=global?global:this,l=function(a,b){if(b){var c=k;a=a.split(".");for(var d=0;d<a.length-1;d++){var e=a[d];e in c||(c[e]={});c=c[e]}a=a[a.length-1];d=c[a];b=b(d);b!=d&&null!=b&&h(c,a,{configurable:!0,writable:!0,value:b})}},n=function(){n=function(){};k.Symbol||(k.Symbol=q)},t=0,q=function(a){return"jscomp_symbol_"+(a||"")+t++},v=function(){n();var a=k.Symbol.iterator;a||(a=k.Symbol.iterator=k.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&h(Array.prototype,a,{configurable:!0,writable:!0,
value:function(){return u(this)}});v=function(){}},u=function(a){var b=0;return w(function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}})},w=function(a){v();a={next:a};a[k.Symbol.iterator]=function(){return this};return a},x=function(a){v();var b=a[Symbol.iterator];return b?b.call(a):u(a)};
l("Promise",function(a){function b(){this.a=null}if(a)return a;b.prototype.b=function(a){null==this.a&&(this.a=[],this.f());this.a.push(a)};b.prototype.f=function(){var a=this;this.c(function(){a.h()})};var c=k.setTimeout;b.prototype.c=function(a){c(a,0)};b.prototype.h=function(){for(;this.a&&this.a.length;){var a=this.a;this.a=[];for(var b=0;b<a.length;++b){var c=a[b];delete a[b];try{c()}catch(r){this.g(r)}}}this.a=null};b.prototype.g=function(a){this.c(function(){throw a;})};var d=function(a){this.b=
0;this.h=void 0;this.a=[];var b=this.f();try{a(b.resolve,b.reject)}catch(p){b.reject(p)}};d.prototype.f=function(){function a(a){return function(d){c||(c=!0,a.call(b,d))}}var b=this,c=!1;return{resolve:a(this.ca),reject:a(this.g)}};d.prototype.ca=function(a){if(a===this)this.g(new TypeError("A Promise cannot resolve to itself"));else if(a instanceof d)this.da(a);else{var b;a:switch(typeof a){case "object":b=null!=a;break a;case "function":b=!0;break a;default:b=!1}b?this.w(a):this.j(a)}};d.prototype.w=
function(a){var b=void 0;try{b=a.then}catch(p){this.g(p);return}"function"==typeof b?this.ea(b,a):this.j(a)};d.prototype.g=function(a){this.o(2,a)};d.prototype.j=function(a){this.o(1,a)};d.prototype.o=function(a,b){if(0!=this.b)throw Error("Cannot settle("+a+", "+b|"): Promise already settled in state"+this.b);this.b=a;this.h=b;this.v()};d.prototype.v=function(){if(null!=this.a){for(var a=this.a,b=0;b<a.length;++b)a[b].call(),a[b]=null;this.a=null}};var e=new b;d.prototype.da=function(a){var b=this.f();
a.c(b.resolve,b.reject)};d.prototype.ea=function(a,b){var c=this.f();try{a.call(b,c.resolve,c.reject)}catch(r){c.reject(r)}};d.prototype.then=function(a,b){function c(a,b){return"function"==typeof a?function(b){try{e(a(b))}catch(W){g(W)}}:b}var e,g,m=new d(function(a,b){e=a;g=b});this.c(c(a,e),c(b,g));return m};d.prototype.catch=function(a){return this.then(void 0,a)};d.prototype.c=function(a,b){function c(){switch(d.b){case 1:a(d.h);break;case 2:b(d.h);break;default:throw Error("Unexpected state: "+
d.b);}}var d=this;null==this.a?e.b(c):this.a.push(function(){e.b(c)})};d.resolve=function(a){return a instanceof d?a:new d(function(b){b(a)})};d.reject=function(a){return new d(function(b,c){c(a)})};d.b=function(a){return new d(function(b,c){for(var e=x(a),g=e.next();!g.done;g=e.next())d.resolve(g.value).c(b,c)})};d.a=function(a){var b=x(a),c=b.next();return c.done?d.resolve([]):new d(function(a,e){function g(b){return function(c){m[b]=c;p--;0==p&&a(m)}}var m=[],p=0;do m.push(void 0),p++,d.resolve(c.value).c(g(m.length-
1),e),c=b.next();while(!c.done)})};d.$jscomp$new$AsyncExecutor=function(){return new b};return d});l("Array.prototype.findIndex",function(a){return a?a:function(a,c){a:{var b=this;b instanceof String&&(b=String(b));for(var e=b.length,g=0;g<e;g++)if(a.call(c,b[g],g,b)){a=g;break a}a=-1}return a}});l("Object.assign",function(a){return a?a:function(a,c){for(var b=1;b<arguments.length;b++){var e=arguments[b];if(e)for(var g in e)Object.prototype.hasOwnProperty.call(e,g)&&(a[g]=e[g])}return a}});
var y=this,z=function(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b},A=function(a,b){function c(){}c.prototype=b.prototype;a.ja=b.prototype;a.prototype=new c;a.fa=function(a,c,g){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};var B={i:"only-available-in-window",A:"only-available-in-sw",U:"should-be-overriden",l:"bad-sender-id",I:"incorrect-gcm-sender-id",S:"permission-default",R:"permission-blocked",Z:"unsupported-browser",L:"notifications-blocked",F:"failed-serviceworker-registration",m:"sw-registration-expected",H:"get-subscription-failed",K:"invalid-saved-token",s:"sw-reg-redundant",V:"token-subscribe-failed",X:"token-subscribe-no-token",W:"token-subscribe-no-push-set",$:"use-sw-before-get-token",J:"invalid-delete-token",
D:"delete-token-not-found",B:"bg-handler-function-expected",P:"no-window-client-to-msg",Y:"unable-to-resubscribe",N:"no-fcm-token-for-resubscribe",G:"failed-to-delete-token",O:"no-sw-in-reg"},C={},D=(C[B.i]="This method is available in a Window context.",C[B.A]="This method is available in a service worker context.",C[B.U]="This method should be overriden by extended classes.",C[B.l]="Please ensure that 'messagingSenderId' is set correctly in the options passed into firebase.initializeApp().",C[B.S]=
"The required permissions were not granted and dismissed instead.",C[B.R]="The required permissions were not granted and blocked instead.",C[B.Z]="This browser doesn't support the API's required to use the firebase SDK.",C[B.L]="Notifications have been blocked.",C[B.F]="We are unable to register the default service worker. {$browserErrorMessage}",C[B.m]="A service worker registration was the expected input.",C[B.H]="There was an error when trying to get any existing Push Subscriptions.",C[B.K]="Unable to access details of the saved token.",
C[B.s]="The service worker being used for push was made redundant.",C[B.V]="A problem occured while subscribing the user to FCM: {$message}",C[B.X]="FCM returned no token when subscribing the user to push.",C[B.W]="FCM returned an invalid response when getting an FCM token.",C[B.$]="You must call useServiceWorker() before calling getToken() to ensure your service worker is used.",C[B.J]="You must pass a valid token into deleteToken(), i.e. the token from getToken().",C[B.D]="The deletion attempt for token could not be performed as the token was not found.",
C[B.B]="The input to setBackgroundMessageHandler() must be a function.",C[B.P]="An attempt was made to message a non-existant window client.",C[B.Y]="There was an error while re-subscribing the FCM token for push messaging. Will have to resubscribe the user on next visit. {$message}",C[B.N]="Could not find an FCM token and as a result, unable to resubscribe. Will have to resubscribe the user on next visit.",C[B.G]="Unable to delete the currently saved token.",C[B.O]="Even though the service worker registration was successful, there was a problem accessing the service worker itself.",
C[B.I]="Please change your web app manifest's 'gcm_sender_id' value to '103953800507' to use Firebase messaging.",C);var E={userVisibleOnly:!0,applicationServerKey:new Uint8Array([4,51,148,247,223,161,235,177,220,3,162,94,21,113,219,72,211,46,237,237,178,52,219,183,71,58,12,143,196,204,225,111,60,140,132,223,171,182,102,62,242,12,212,139,254,227,249,118,47,20,28,99,8,106,111,45,177,26,149,176,206,55,192,156,110])};var F={u:"firebase-messaging-msg-type",C:"firebase-messaging-msg-data"},G={T:"push-msg-received",M:"notification-clicked"},H=function(a,b){var c={};return c[F.u]=a,c[F.C]=b,c};var I=function(a){if(Error.captureStackTrace)Error.captureStackTrace(this,I);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))};A(I,Error);var J=function(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};var K=function(a,b){b.unshift(a);I.call(this,J.apply(null,b));b.shift()};A(K,I);var aa=function(a,b,c){if(!a){var d="Assertion failed";if(b)var d=d+(": "+b),e=Array.prototype.slice.call(arguments,2);throw new K(""+d,e||[]);}};var L=null;var M=function(a){a=new Uint8Array(a);var b=z(a);aa("array"==b||"object"==b&&"number"==typeof a.length,"encodeByteArray takes an array as a parameter");if(!L)for(L={},b=0;65>b;b++)L[b]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(b);for(var b=L,c=[],d=0;d<a.length;d+=3){var e=a[d],g=d+1<a.length,m=g?a[d+1]:0,p=d+2<a.length,r=p?a[d+2]:0,V=e>>2,e=(e&3)<<4|m>>4,m=(m&15)<<2|r>>6,r=r&63;p||(r=64,g||(m=64));c.push(b[V],b[e],b[m],b[r])}return c.join("").replace(/\+/g,"-").replace(/\//g,
"_").replace(/=+$/,"")};var N=new firebase.INTERNAL.ErrorFactory("messaging","Messaging",D),O=function(){this.a=null},P=function(a){if(a.a)return a.a;a.a=new Promise(function(a,c){var b=y.indexedDB.open("fcm_token_details_db",1);b.onerror=function(a){c(a.target.error)};b.onsuccess=function(b){a(b.target.result)};b.onupgradeneeded=function(a){a=a.target.result.createObjectStore("fcm_token_object_Store",{keyPath:"swScope"});a.createIndex("fcmSenderId","fcmSenderId",{unique:!1});a.createIndex("fcmToken","fcmToken",{unique:!0})}});
return a.a},ba=function(a){a.a?a.a.then(function(b){b.close();a.a=null}):Promise.resolve()},Q=function(a,b){return P(a).then(function(a){return new Promise(function(c,e){var d=a.transaction(["fcm_token_object_Store"]).objectStore("fcm_token_object_Store").index("fcmToken").get(b);d.onerror=function(a){e(a.target.error)};d.onsuccess=function(a){c(a.target.result)}})})},ca=function(a,b){return P(a).then(function(a){return new Promise(function(c,e){var d=[],m=a.transaction(["fcm_token_object_Store"]).objectStore("fcm_token_object_Store").openCursor();
m.onerror=function(a){e(a.target.error)};m.onsuccess=function(a){(a=a.target.result)?(a.value.fcmSenderId===b&&d.push(a.value),a.continue()):c(d)}})})},R=function(a,b,c){var d=M(b.getKey("p256dh")),e=M(b.getKey("auth"));a="authorized_entity="+a+"&"+("endpoint="+b.endpoint+"&")+("encryption_key="+d+"&")+("encryption_auth="+e);c&&(a+="&pushSet="+c);c=new Headers;c.append("Content-Type","application/x-www-form-urlencoded");return fetch("https://fcm.googleapis.com/fcm/connect/subscribe",{method:"POST",
headers:c,body:a}).then(function(a){return a.json()}).then(function(a){if(a.error)throw N.create(B.V,{message:a.error.message});if(!a.token)throw N.create(B.X);if(!a.pushSet)throw N.create(B.W);return{token:a.token,pushSet:a.pushSet}})},da=function(a,b,c,d,e,g){var m={swScope:c.scope,endpoint:d.endpoint,auth:M(d.getKey("auth")),p256dh:M(d.getKey("p256dh")),fcmToken:e,fcmPushSet:g,fcmSenderId:b};return P(a).then(function(a){return new Promise(function(b,c){var d=a.transaction(["fcm_token_object_Store"],
"readwrite").objectStore("fcm_token_object_Store").put(m);d.onerror=function(a){c(a.target.error)};d.onsuccess=function(){b()}})})};
O.prototype.ba=function(a,b){return b instanceof ServiceWorkerRegistration?"string"!==typeof a||0===a.length?Promise.reject(N.create(B.l)):ca(this,a).then(function(c){if(0!==c.length){var d=c.findIndex(function(c){return b.scope===c.swScope&&a===c.fcmSenderId});if(-1!==d)return c[d]}}).then(function(a){if(a)return b.pushManager.getSubscription().catch(function(){throw N.create(B.H);}).then(function(b){var c;if(c=b)c=b.endpoint===a.endpoint&&M(b.getKey("auth"))===a.auth&&M(b.getKey("p256dh"))===a.p256dh;
if(c)return a.fcmToken})}):Promise.reject(N.create(B.m))};O.prototype.getSavedToken=O.prototype.ba;O.prototype.aa=function(a,b){var c=this;return"string"!==typeof a||0===a.length?Promise.reject(N.create(B.l)):b instanceof ServiceWorkerRegistration?b.pushManager.getSubscription().then(function(a){return a?a:b.pushManager.subscribe(E)}).then(function(d){return R(a,d).then(function(e){return da(c,a,b,d,e.token,e.pushSet).then(function(){return e.token})})}):Promise.reject(N.create(B.m))};
O.prototype.createToken=O.prototype.aa;O.prototype.deleteToken=function(a){var b=this;return"string"!==typeof a||0===a.length?Promise.reject(N.create(B.J)):Q(this,a).then(function(a){if(!a)throw N.create(B.D);return P(b).then(function(b){return new Promise(function(c,d){var e=b.transaction(["fcm_token_object_Store"],"readwrite").objectStore("fcm_token_object_Store").delete(a.swScope);e.onerror=function(a){d(a.target.error)};e.onsuccess=function(b){0===b.target.result?d(N.create(B.G)):c(a)}})})})};var S=function(a){var b=this;this.a=new firebase.INTERNAL.ErrorFactory("messaging","Messaging",D);if(!a.options.messagingSenderId||"string"!==typeof a.options.messagingSenderId)throw this.a.create(B.l);this.j=a.options.messagingSenderId;this.c=new O;this.app=a;this.INTERNAL={};this.INTERNAL.delete=function(){return b.delete}};
S.prototype.getToken=function(){var a=this,b=Notification.permission;return"granted"!==b?"denied"===b?Promise.reject(this.a.create(B.L)):Promise.resolve(null):this.f().then(function(b){return a.c.ba(a.j,b).then(function(c){return c?c:a.c.aa(a.j,b)})})};S.prototype.getToken=S.prototype.getToken;S.prototype.deleteToken=function(a){var b=this;return this.c.deleteToken(a).then(function(){return b.f()}).then(function(a){return a?a.pushManager.getSubscription():null}).then(function(a){if(a)return a.unsubscribe()})};
S.prototype.deleteToken=S.prototype.deleteToken;S.prototype.f=function(){throw this.a.create(B.U);};S.prototype.requestPermission=function(){throw this.a.create(B.i);};S.prototype.useServiceWorker=function(){throw this.a.create(B.i);};S.prototype.useServiceWorker=S.prototype.useServiceWorker;S.prototype.onMessage=function(){throw this.a.create(B.i);};S.prototype.onMessage=S.prototype.onMessage;S.prototype.onTokenRefresh=function(){throw this.a.create(B.i);};S.prototype.onTokenRefresh=S.prototype.onTokenRefresh;
S.prototype.setBackgroundMessageHandler=function(){throw this.a.create(B.A);};S.prototype.setBackgroundMessageHandler=S.prototype.setBackgroundMessageHandler;S.prototype.delete=function(){ba(this.c)};var T=self,U=function(a){var b=this;S.call(this,a);this.a=new firebase.INTERNAL.ErrorFactory("messaging","Messaging",D);T.addEventListener("push",function(a){return ea(b,a)},!1);T.addEventListener("pushsubscriptionchange",function(a){return fa(b,a)},!1);T.addEventListener("notificationclick",function(a){return ga(b,a)},!1);this.b=null};f(U,S);
var ea=function(a,b){var c;try{c=b.data.json()}catch(e){return}var d=ha().then(function(b){if(b){if(c.notification||a.b)return ia(a,c)}else{if((b=c)&&"object"===typeof b.notification){var d=Object.assign({},b.notification),e={};d.data=(e.FCM_MSG=b,e);b=d}else b=void 0;if(b)return T.registration.showNotification(b.title||"",b);if(a.b)return a.b(c)}});b.waitUntil(d)},fa=function(a,b){var c=a.getToken().then(function(b){if(!b)throw a.a.create(B.N);var c=a.c;return Q(c,b).then(function(b){if(!b)throw a.a.create(B.K);
return T.registration.pushManager.subscribe(E).then(function(a){return R(b.ha,a,b.ga)}).catch(function(d){return c.deleteToken(b.ia).then(function(){throw a.a.create(B.Y,{message:d});})})})});b.waitUntil(c)},ga=function(a,b){if(b.notification&&b.notification.data&&b.notification.data.FCM_MSG){b.stopImmediatePropagation();b.notification.close();var c=b.notification.data.FCM_MSG,d=c.notification.click_action;if(d){var e=ja(d).then(function(a){return a?a:T.clients.openWindow(d)}).then(function(b){if(b)return delete c.notification,
X(a,b,H(G.M,c))});b.waitUntil(e)}}};U.prototype.setBackgroundMessageHandler=function(a){if(a&&"function"!==typeof a)throw this.a.create(B.B);this.b=a};U.prototype.setBackgroundMessageHandler=U.prototype.setBackgroundMessageHandler;
var ja=function(a){var b=(new URL(a)).href;return T.clients.matchAll({type:"window",includeUncontrolled:!0}).then(function(a){for(var c=null,e=0;e<a.length;e++)if((new URL(a[e].url)).href===b){c=a[e];break}if(c)return c.focus(),c})},X=function(a,b,c){return new Promise(function(d,e){if(!b)return e(a.a.create(B.P));b.postMessage(c);d()})},ha=function(){return T.clients.matchAll({type:"window",includeUncontrolled:!0}).then(function(a){return a.some(function(a){return"visible"===a.visibilityState})})},
ia=function(a,b){return T.clients.matchAll({type:"window",includeUncontrolled:!0}).then(function(c){var d=H(G.T,b);return Promise.all(c.map(function(b){return X(a,b,d)}))})};U.prototype.f=function(){return Promise.resolve(T.registration)};var Y=function(a){var b=this;S.call(this,a);this.h=null;this.o=firebase.INTERNAL.createSubscribe(function(a){b.h=a});this.w=null;this.v=firebase.INTERNAL.createSubscribe(function(a){b.w=a});ka(this)};f(Y,S);
Y.prototype.getToken=function(){var a=this;return"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")?la(this).then(function(){return S.prototype.getToken.call(a)}):Promise.reject(this.a.create(B.Z))};Y.prototype.getToken=Y.prototype.getToken;
var la=function(a){if(a.g)return a.g;var b=document.querySelector('link[rel="manifest"]');b?a.g=fetch(b.href).then(function(a){return a.json()}).catch(function(){return Promise.resolve()}).then(function(b){if(b&&b.gcm_sender_id&&"103953800507"!==b.gcm_sender_id)throw a.a.create(B.I);}):a.g=Promise.resolve();return a.g};
Y.prototype.requestPermission=function(){var a=this;return"granted"===Notification.permission?Promise.resolve():new Promise(function(b,c){var d=function(d){return"granted"===d?b():"denied"===d?c(a.a.create(B.R)):c(a.a.create(B.S))},e=Notification.requestPermission(function(a){e||d(a)});e&&e.then(d)})};Y.prototype.requestPermission=Y.prototype.requestPermission;
Y.prototype.useServiceWorker=function(a){if(!(a instanceof ServiceWorkerRegistration))throw this.a.create(B.m);if("undefined"!==typeof this.b)throw this.a.create(B.$);this.b=a};Y.prototype.useServiceWorker=Y.prototype.useServiceWorker;Y.prototype.onMessage=function(a,b,c){return this.o(a,b,c)};Y.prototype.onMessage=Y.prototype.onMessage;Y.prototype.onTokenRefresh=function(a,b,c){return this.v(a,b,c)};Y.prototype.onTokenRefresh=Y.prototype.onTokenRefresh;
var Z=function(a,b){var c=b.installing||b.waiting||b.active;return new Promise(function(d,e){if(c)if("activated"===c.state)d(b);else if("redundant"===c.state)e(a.a.create(B.s));else{var g=function(){if("activated"===c.state)d(b);else if("redundant"===c.state)e(a.a.create(B.s));else return;c.removeEventListener("statechange",g)};c.addEventListener("statechange",g)}else e(a.a.create(B.O))})};
Y.prototype.f=function(){var a=this;if(this.b)return Z(this,this.b);this.b=null;return navigator.serviceWorker.register("/firebase-messaging-sw.js",{scope:"/firebase-cloud-messaging-push-scope"}).catch(function(b){throw a.a.create(B.F,{browserErrorMessage:b.message});}).then(function(b){return Z(a,b).then(function(){a.b=b;b.update();return b})})};
var ka=function(a){"serviceWorker"in navigator&&navigator.serviceWorker.addEventListener("message",function(b){if(b.data&&b.data[F.u])switch(b=b.data,b[F.u]){case G.T:case G.M:a.h.next(b[F.C])}},!1)};if(!(firebase&&firebase.INTERNAL&&firebase.INTERNAL.registerService))throw Error("Cannot install Firebase Messaging - be sure to load firebase-app.js first.");firebase.INTERNAL.registerService("messaging",function(a){return self&&"ServiceWorkerGlobalScope"in self?new U(a):new Y(a)},{Messaging:Y});})();
module.exports = firebase.messaging;

},{"./app":4}],9:[function(require,module,exports){
var firebase = require('./app');
/*! @license Firebase v3.5.2
    Build: 3.5.2-rc.1
    Terms: https://developers.google.com/terms */
(function() {var k,aa=aa||{},l=this,n=function(a){return void 0!==a},ba=function(){},ca=function(){throw Error("unimplemented abstract method");},p=function(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";
if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";else if("function"==b&&"undefined"==typeof a.call)return"object";return b},da=function(a){var b=p(a);return"array"==b||"object"==b&&"number"==typeof a.length},r=function(a){return"string"==typeof a},t=function(a){return"function"==p(a)},ea=function(a){var b=typeof a;return"object"==b&&null!=a||"function"==b},fa="closure_uid_"+(1E9*Math.random()>>>
0),ga=0,ha=function(a,b,c){return a.call.apply(a.bind,arguments)},ia=function(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}},u=function(a,b,c){u=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?ha:ia;return u.apply(null,arguments)},ja=Date.now||function(){return+new Date},
v=function(a,b){function c(){}c.prototype=b.prototype;a.I=b.prototype;a.prototype=new c;a.Ka=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};var ka=function(a,b,c){function d(){P||(P=!0,b.apply(null,arguments))}function e(b){m=setTimeout(function(){m=null;a(f,2===Q)},b)}function f(a,b){if(!P)if(a)d.apply(null,arguments);else if(2===Q||q)d.apply(null,arguments);else{64>h&&(h*=2);var c;1===Q?(Q=2,c=0):c=1E3*(h+Math.random());e(c)}}function g(a){jc||(jc=!0,P||(null!==m?(a||(Q=2),clearTimeout(m),e(0)):a||(Q=1)))}var h=1,m=null,q=!1,Q=0,P=!1,jc=!1;e(0);setTimeout(function(){q=!0;g(!0)},c);return g};var la="https://firebasestorage.googleapis.com";var w=function(a,b){this.code="storage/"+a;this.message="Firebase Storage: "+b;this.serverResponse=null;this.name="FirebaseError"};v(w,Error);
var ma=function(){return new w("unknown","An unknown error occurred, please check the error payload for server response.")},na=function(){return new w("canceled","User canceled the upload/download.")},oa=function(){return new w("cannot-slice-blob","Cannot slice blob for upload. Please retry the upload.")},pa=function(a,b,c){return new w("invalid-argument","Invalid argument in `"+b+"` at index "+a+": "+c)},qa=function(){return new w("app-deleted","The Firebase app was deleted.")},ra=function(a,b){return new w("invalid-format",
"String does not match format '"+a+"': "+b)};var sa=function(a,b){for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&b(c,a[c])},ta=function(a){var b={};sa(a,function(a,d){b[a]=d});return b};var x=function(a,b,c,d){this.i=a;this.b={};this.method=b;this.headers={};this.body="";this.M=c;this.c=this.a=null;this.f=[200];this.h=[];this.timeout=d;this.g=!0};var ua={STATE_CHANGED:"state_changed"},va={RUNNING:"running",PAUSED:"paused",SUCCESS:"success",CANCELED:"canceled",ERROR:"error"},wa=function(a){switch(a){case "running":case "pausing":case "canceling":return"running";case "paused":return"paused";case "success":return"success";case "canceled":return"canceled";case "error":return"error";default:return"error"}};var y=function(a){return n(a)&&null!==a},xa=function(a){return"string"===typeof a||a instanceof String},ya=function(){return"undefined"!==typeof Blob};var za=function(a,b,c){this.f=c;this.c=a;this.g=b;this.b=0;this.a=null};za.prototype.get=function(){var a;0<this.b?(this.b--,a=this.a,this.a=a.next,a.next=null):a=this.c();return a};var Aa=function(a,b){a.g(b);a.b<a.f&&(a.b++,b.next=a.a,a.a=b)};var z=function(a){if(Error.captureStackTrace)Error.captureStackTrace(this,z);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))};v(z,Error);z.prototype.name="CustomError";var Ba=function(a,b,c,d,e){this.reset(a,b,c,d,e)};Ba.prototype.a=null;var Ca=0;Ba.prototype.reset=function(a,b,c,d,e){"number"==typeof e||Ca++;d||ja();this.b=b;delete this.a};var Da=function(a){var b=[],c=0,d;for(d in a)b[c++]=a[d];return b},Ea=function(a){var b=[],c=0,d;for(d in a)b[c++]=d;return b},Fa="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "),Ga=function(a,b){for(var c,d,e=1;e<arguments.length;e++){d=arguments[e];for(c in d)a[c]=d[c];for(var f=0;f<Fa.length;f++)c=Fa[f],Object.prototype.hasOwnProperty.call(d,c)&&(a[c]=d[c])}};var Ha=function(a){a.prototype.then=a.prototype.then;a.prototype.$goog_Thenable=!0},Ia=function(a){if(!a)return!1;try{return!!a.$goog_Thenable}catch(b){return!1}};var Ja=function(a){Ja[" "](a);return a};Ja[" "]=ba;var La=function(a,b){var c=Ka;return Object.prototype.hasOwnProperty.call(c,a)?c[a]:c[a]=b(a)};var Ma=function(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")},Na=String.prototype.trim?function(a){return a.trim()}:function(a){return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")},Oa=function(a,b){return a<b?-1:a>b?1:0};var Pa=function(a,b){this.a=a;this.b=b};var Qa=function(a,b){this.bucket=a;this.path=b},Ra=function(a){var b=encodeURIComponent;return"/b/"+b(a.bucket)+"/o/"+b(a.path)},Sa=function(a){for(var b=null,c=[{ia:/^gs:\/\/([A-Za-z0-9.\-]+)(\/(.*))?$/i,ba:{bucket:1,path:3},ha:function(a){"/"===a.path.charAt(a.path.length-1)&&(a.path=a.path.slice(0,-1))}},{ia:/^https?:\/\/firebasestorage\.googleapis\.com\/v[A-Za-z0-9_]+\/b\/([A-Za-z0-9.\-]+)\/o(\/([^?#]*).*)?$/i,ba:{bucket:1,path:3},ha:function(a){a.path=decodeURIComponent(a.path)}}],d=0;d<c.length;d++){var e=
c[d],f=e.ia.exec(a);if(f){b=f[e.ba.bucket];(f=f[e.ba.path])||(f="");b=new Qa(b,f);e.ha(b);break}}if(null==b)throw new w("invalid-url","Invalid URL '"+a+"'.");return b};var Ta=function(a,b,c){t(a)||y(b)||y(c)?(this.next=a,this.a=b||null,this.b=c||null):(this.next=a.next||null,this.a=a.error||null,this.b=a.complete||null)};var Ua={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"},Va=function(a){switch(a){case "raw":case "base64":case "base64url":case "data_url":break;default:throw"Expected one of the event types: [raw, base64, base64url, data_url].";}},Wa=function(a,b){this.data=a;this.a=b||null},$a=function(a,b){switch(a){case "raw":return new Wa(Xa(b));case "base64":case "base64url":return new Wa(Ya(a,b));case "data_url":return a=new Za(b),a=a.a?Ya("base64",a.c):Xa(a.c),new Wa(a,(new Za(b)).b)}throw ma();
},Xa=function(a){for(var b=[],c=0;c<a.length;c++){var d=a.charCodeAt(c);if(127>=d)b.push(d);else if(2047>=d)b.push(192|d>>6,128|d&63);else if(55296==(d&64512))if(c<a.length-1&&56320==(a.charCodeAt(c+1)&64512)){var e=a.charCodeAt(++c),d=65536|(d&1023)<<10|e&1023;b.push(240|d>>18,128|d>>12&63,128|d>>6&63,128|d&63)}else b.push(239,191,189);else 56320==(d&64512)?b.push(239,191,189):b.push(224|d>>12,128|d>>6&63,128|d&63)}return new Uint8Array(b)},Ya=function(a,b){switch(a){case "base64":var c=-1!==b.indexOf("-"),
d=-1!==b.indexOf("_");if(c||d)throw ra(a,"Invalid character '"+(c?"-":"_")+"' found: is it base64url encoded?");break;case "base64url":c=-1!==b.indexOf("+");d=-1!==b.indexOf("/");if(c||d)throw ra(a,"Invalid character '"+(c?"+":"/")+"' found: is it base64 encoded?");b=b.replace(/-/g,"+").replace(/_/g,"/")}var e;try{e=atob(b)}catch(f){throw ra(a,"Invalid character found");}a=new Uint8Array(e.length);for(b=0;b<e.length;b++)a[b]=e.charCodeAt(b);return a},Za=function(a){var b=a.match(/^data:([^,]+)?,/);
if(null===b)throw ra("data_url","Must be formatted 'data:[<mediatype>][;base64],<data>");b=b[1]||null;this.a=!1;this.b=null;if(null!=b){var c=b.length-7;this.b=(this.a=0<=c&&b.indexOf(";base64",c)==c)?b.substring(0,b.length-7):b}this.c=a.substring(a.indexOf(",")+1)};var ab=function(a){var b=encodeURIComponent,c="?";sa(a,function(a,e){a=b(a)+"="+b(e);c=c+a+"&"});return c=c.slice(0,-1)};var A=function(a,b,c,d,e,f){this.b=a;this.h=b;this.f=c;this.a=d;this.g=e;this.c=f};k=A.prototype;k.na=function(){return this.b};k.Ja=function(){return this.h};k.Ga=function(){return this.f};k.Ba=function(){return this.a};k.pa=function(){if(y(this.a)){var a=this.a.downloadURLs;return y(a)&&y(a[0])?a[0]:null}return null};k.Ia=function(){return this.g};k.Ea=function(){return this.c};var bb=function(a,b){b.unshift(a);z.call(this,Ma.apply(null,b));b.shift()};v(bb,z);bb.prototype.name="AssertionError";
var cb=function(a,b,c,d){var e="Assertion failed";if(c)var e=e+(": "+c),f=d;else a&&(e+=": "+a,f=b);throw new bb(""+e,f||[]);},B=function(a,b,c){a||cb("",null,b,Array.prototype.slice.call(arguments,2))},db=function(a,b){throw new bb("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));},eb=function(a,b,c){t(a)||cb("Expected function but got %s: %s.",[p(a),a],b,Array.prototype.slice.call(arguments,2))};var fb=function(){this.g=this.g;this.o=this.o};fb.prototype.g=!1;fb.prototype.ea=function(){this.g||(this.g=!0,this.D())};fb.prototype.D=function(){if(this.o)for(;this.o.length;)this.o.shift()()};var gb="closure_listenable_"+(1E6*Math.random()|0),hb=0;var ib;a:{var jb=l.navigator;if(jb){var kb=jb.userAgent;if(kb){ib=kb;break a}}ib=""}var C=function(a){return-1!=ib.indexOf(a)};var lb=function(){};lb.prototype.b=null;lb.prototype.a=ca;var mb=function(a){return a.b||(a.b=a.f())};lb.prototype.f=ca;var nb=Array.prototype.indexOf?function(a,b,c){B(null!=a.length);return Array.prototype.indexOf.call(a,b,c)}:function(a,b,c){c=null==c?0:0>c?Math.max(0,a.length+c):c;if(r(a))return r(b)&&1==b.length?a.indexOf(b,c):-1;for(;c<a.length;c++)if(c in a&&a[c]===b)return c;return-1},ob=Array.prototype.forEach?function(a,b,c){B(null!=a.length);Array.prototype.forEach.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=r(a)?a.split(""):a,f=0;f<d;f++)f in e&&b.call(c,e[f],f,a)},pb=Array.prototype.filter?function(a,
b,c){B(null!=a.length);return Array.prototype.filter.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=[],f=0,g=r(a)?a.split(""):a,h=0;h<d;h++)if(h in g){var m=g[h];b.call(c,m,h,a)&&(e[f++]=m)}return e},qb=Array.prototype.map?function(a,b,c){B(null!=a.length);return Array.prototype.map.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=Array(d),f=r(a)?a.split(""):a,g=0;g<d;g++)g in f&&(e[g]=b.call(c,f[g],g,a));return e},rb=Array.prototype.some?function(a,b,c){B(null!=a.length);return Array.prototype.some.call(a,
b,c)}:function(a,b,c){for(var d=a.length,e=r(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&b.call(c,e[f],f,a))return!0;return!1},tb=function(a){var b;a:{b=sb;for(var c=a.length,d=r(a)?a.split(""):a,e=0;e<c;e++)if(e in d&&b.call(void 0,d[e],e,a)){b=e;break a}b=-1}return 0>b?null:r(a)?a.charAt(b):a[b]},ub=function(a,b){return 0<=nb(a,b)},vb=function(a){if("array"!=p(a))for(var b=a.length-1;0<=b;b--)delete a[b];a.length=0},wb=function(a,b){b=nb(a,b);var c;if(c=0<=b)B(null!=a.length),Array.prototype.splice.call(a,
b,1);return c},xb=function(a){var b=a.length;if(0<b){for(var c=Array(b),d=0;d<b;d++)c[d]=a[d];return c}return[]};var zb=new za(function(){return new yb},function(a){a.reset()},100),Bb=function(){var a=Ab,b=null;a.a&&(b=a.a,a.a=a.a.next,a.a||(a.b=null),b.next=null);return b},yb=function(){this.next=this.b=this.a=null};yb.prototype.set=function(a,b){this.a=a;this.b=b;this.next=null};yb.prototype.reset=function(){this.next=this.b=this.a=null};var Cb=function(a,b){this.type=a;this.a=this.target=b;this.ja=!0};Cb.prototype.b=function(){this.ja=!1};var Db=function(a,b,c,d,e){this.listener=a;this.a=null;this.src=b;this.type=c;this.U=!!d;this.M=e;++hb;this.N=this.T=!1},Eb=function(a){a.N=!0;a.listener=null;a.a=null;a.src=null;a.M=null};var Fb=/^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;var Gb=function(a,b){b=pb(b.split("/"),function(a){return 0<a.length}).join("/");return 0===a.length?b:a+"/"+b},Hb=function(a){var b=a.lastIndexOf("/",a.length-2);return-1===b?a:a.slice(b+1)};var Ib=function(a){this.src=a;this.a={};this.b=0},Kb=function(a,b,c,d,e,f){var g=b.toString();b=a.a[g];b||(b=a.a[g]=[],a.b++);var h=Jb(b,c,e,f);-1<h?(a=b[h],d||(a.T=!1)):(a=new Db(c,a.src,g,!!e,f),a.T=d,b.push(a));return a},Lb=function(a,b){var c=b.type;c in a.a&&wb(a.a[c],b)&&(Eb(b),0==a.a[c].length&&(delete a.a[c],a.b--))},Jb=function(a,b,c,d){for(var e=0;e<a.length;++e){var f=a[e];if(!f.N&&f.listener==b&&f.U==!!c&&f.M==d)return e}return-1};var Mb,Nb=function(){};v(Nb,lb);Nb.prototype.a=function(){var a=Ob(this);return a?new ActiveXObject(a):new XMLHttpRequest};Nb.prototype.f=function(){var a={};Ob(this)&&(a[0]=!0,a[1]=!0);return a};
var Ob=function(a){if(!a.c&&"undefined"==typeof XMLHttpRequest&&"undefined"!=typeof ActiveXObject){for(var b=["MSXML2.XMLHTTP.6.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"],c=0;c<b.length;c++){var d=b[c];try{return new ActiveXObject(d),a.c=d}catch(e){}}throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed");}return a.c};Mb=new Nb;var Pb=function(a){this.a=[];if(a)a:{var b;if(a instanceof Pb){if(b=a.H(),a=a.A(),0>=this.b()){for(var c=this.a,d=0;d<b.length;d++)c.push(new Pa(b[d],a[d]));break a}}else b=Ea(a),a=Da(a);for(d=0;d<b.length;d++)Qb(this,b[d],a[d])}},Qb=function(a,b,c){var d=a.a;d.push(new Pa(b,c));b=d.length-1;a=a.a;for(c=a[b];0<b;)if(d=b-1>>1,a[d].a>c.a)a[b]=a[d],b=d;else break;a[b]=c};Pb.prototype.A=function(){for(var a=this.a,b=[],c=a.length,d=0;d<c;d++)b.push(a[d].b);return b};
Pb.prototype.H=function(){for(var a=this.a,b=[],c=a.length,d=0;d<c;d++)b.push(a[d].a);return b};Pb.prototype.b=function(){return this.a.length};var Rb=function(){this.c=[];this.a=[]},Sb=function(a){0==a.c.length&&(a.c=a.a,a.c.reverse(),a.a=[]);return a.c.pop()};Rb.prototype.b=function(){return this.c.length+this.a.length};Rb.prototype.A=function(){for(var a=[],b=this.c.length-1;0<=b;--b)a.push(this.c[b]);for(var c=this.a.length,b=0;b<c;++b)a.push(this.a[b]);return a};var Tb=function(a){if(a.A&&"function"==typeof a.A)return a.A();if(r(a))return a.split("");if(da(a)){for(var b=[],c=a.length,d=0;d<c;d++)b.push(a[d]);return b}return Da(a)},Ub=function(a,b){if(a.forEach&&"function"==typeof a.forEach)a.forEach(b,void 0);else if(da(a)||r(a))ob(a,b,void 0);else{var c;if(a.H&&"function"==typeof a.H)c=a.H();else if(a.A&&"function"==typeof a.A)c=void 0;else if(da(a)||r(a)){c=[];for(var d=a.length,e=0;e<d;e++)c.push(e)}else c=Ea(a);for(var d=Tb(a),e=d.length,f=0;f<e;f++)b.call(void 0,
d[f],c&&c[f],a)}};var Vb=function(a){l.setTimeout(function(){throw a;},0)},Wb,Xb=function(){var a=l.MessageChannel;"undefined"===typeof a&&"undefined"!==typeof window&&window.postMessage&&window.addEventListener&&!C("Presto")&&(a=function(){var a=document.createElement("IFRAME");a.style.display="none";a.src="";document.documentElement.appendChild(a);var b=a.contentWindow,a=b.document;a.open();a.write("");a.close();var c="callImmediate"+Math.random(),d="file:"==b.location.protocol?"*":b.location.protocol+"//"+b.location.host,
a=u(function(a){if(("*"==d||a.origin==d)&&a.data==c)this.port1.onmessage()},this);b.addEventListener("message",a,!1);this.port1={};this.port2={postMessage:function(){b.postMessage(c,d)}}});if("undefined"!==typeof a&&!C("Trident")&&!C("MSIE")){var b=new a,c={},d=c;b.port1.onmessage=function(){if(n(c.next)){c=c.next;var a=c.da;c.da=null;a()}};return function(a){d.next={da:a};d=d.next;b.port2.postMessage(0)}}return"undefined"!==typeof document&&"onreadystatechange"in document.createElement("SCRIPT")?
function(a){var b=document.createElement("SCRIPT");b.onreadystatechange=function(){b.onreadystatechange=null;b.parentNode.removeChild(b);b=null;a();a=null};document.documentElement.appendChild(b)}:function(a){l.setTimeout(a,0)}};var Yb="StopIteration"in l?l.StopIteration:{message:"StopIteration",stack:""},Zb=function(){};Zb.prototype.next=function(){throw Yb;};Zb.prototype.h=function(){return this};var $b=function(){Pb.call(this)};v($b,Pb);var ac=C("Opera"),D=C("Trident")||C("MSIE"),bc=C("Edge"),cc=C("Gecko")&&!(-1!=ib.toLowerCase().indexOf("webkit")&&!C("Edge"))&&!(C("Trident")||C("MSIE"))&&!C("Edge"),dc=-1!=ib.toLowerCase().indexOf("webkit")&&!C("Edge"),ec=function(){var a=l.document;return a?a.documentMode:void 0},fc;
a:{var gc="",hc=function(){var a=ib;if(cc)return/rv\:([^\);]+)(\)|;)/.exec(a);if(bc)return/Edge\/([\d\.]+)/.exec(a);if(D)return/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);if(dc)return/WebKit\/(\S+)/.exec(a);if(ac)return/(?:Version)[ \/]?(\S+)/.exec(a)}();hc&&(gc=hc?hc[1]:"");if(D){var ic=ec();if(null!=ic&&ic>parseFloat(gc)){fc=String(ic);break a}}fc=gc}
var kc=fc,Ka={},E=function(a){return La(a,function(){for(var b=0,c=Na(String(kc)).split("."),d=Na(String(a)).split("."),e=Math.max(c.length,d.length),f=0;0==b&&f<e;f++){var g=c[f]||"",h=d[f]||"";do{g=/(\d*)(\D*)(.*)/.exec(g)||["","","",""];h=/(\d*)(\D*)(.*)/.exec(h)||["","","",""];if(0==g[0].length&&0==h[0].length)break;b=Oa(0==g[1].length?0:parseInt(g[1],10),0==h[1].length?0:parseInt(h[1],10))||Oa(0==g[2].length,0==h[2].length)||Oa(g[2],h[2]);g=g[3];h=h[3]}while(0==b)}return 0<=b})},lc;var mc=l.document;
lc=mc&&D?ec()||("CSS1Compat"==mc.compatMode?parseInt(kc,10):5):void 0;var qc=function(a,b){nc||oc();pc||(nc(),pc=!0);var c=Ab,d=zb.get();d.set(a,b);c.b?c.b.next=d:(B(!c.a),c.a=d);c.b=d},nc,oc=function(){var a=l.Promise;if(-1!=String(a).indexOf("[native code]")){var b=a.resolve(void 0);nc=function(){b.then(rc)}}else nc=function(){var a=rc;!t(l.setImmediate)||l.Window&&l.Window.prototype&&!C("Edge")&&l.Window.prototype.setImmediate==l.setImmediate?(Wb||(Wb=Xb()),Wb(a)):l.setImmediate(a)}},pc=!1,Ab=new function(){this.b=this.a=null},rc=function(){for(var a;a=Bb();){try{a.a.call(a.b)}catch(b){Vb(b)}Aa(zb,
a)}pc=!1};var sc;(sc=!D)||(sc=9<=Number(lc));var tc=sc,uc=D&&!E("9");!dc||E("528");cc&&E("1.9b")||D&&E("8")||ac&&E("9.5")||dc&&E("528");cc&&!E("8")||D&&E("9");var F=function(a,b){this.c={};this.a=[];this.g=this.f=0;var c=arguments.length;if(1<c){if(c%2)throw Error("Uneven number of arguments");for(var d=0;d<c;d+=2)this.set(arguments[d],arguments[d+1])}else if(a){a instanceof F?(c=a.H(),d=a.A()):(c=Ea(a),d=Da(a));for(var e=0;e<c.length;e++)this.set(c[e],d[e])}};F.prototype.b=function(){return this.f};F.prototype.A=function(){vc(this);for(var a=[],b=0;b<this.a.length;b++)a.push(this.c[this.a[b]]);return a};F.prototype.H=function(){vc(this);return this.a.concat()};
var wc=function(a,b){return Object.prototype.hasOwnProperty.call(a.c,b)?(delete a.c[b],a.f--,a.g++,a.a.length>2*a.f&&vc(a),!0):!1},vc=function(a){if(a.f!=a.a.length){for(var b=0,c=0;b<a.a.length;){var d=a.a[b];Object.prototype.hasOwnProperty.call(a.c,d)&&(a.a[c++]=d);b++}a.a.length=c}if(a.f!=a.a.length){for(var e={},c=b=0;b<a.a.length;)d=a.a[b],Object.prototype.hasOwnProperty.call(e,d)||(a.a[c++]=d,e[d]=1),b++;a.a.length=c}};
F.prototype.get=function(a,b){return Object.prototype.hasOwnProperty.call(this.c,a)?this.c[a]:b};F.prototype.set=function(a,b){Object.prototype.hasOwnProperty.call(this.c,a)||(this.f++,this.a.push(a),this.g++);this.c[a]=b};F.prototype.forEach=function(a,b){for(var c=this.H(),d=0;d<c.length;d++){var e=c[d],f=this.get(e);a.call(b,f,e,this)}};
F.prototype.h=function(a){vc(this);var b=0,c=this.g,d=this,e=new Zb;e.next=function(){if(c!=d.g)throw Error("The map has changed since the iterator was created");if(b>=d.a.length)throw Yb;var e=d.a[b++];return a?e:d.c[e]};return e};var xc=function(a,b){Cb.call(this,a?a.type:"");this.c=this.a=this.target=null;if(a){this.type=a.type;this.target=a.target||a.srcElement;this.a=b;if((b=a.relatedTarget)&&cc)try{Ja(b.nodeName)}catch(c){}this.c=a;a.defaultPrevented&&this.b()}};v(xc,Cb);xc.prototype.b=function(){xc.I.b.call(this);var a=this.c;if(a.preventDefault)a.preventDefault();else if(a.returnValue=!1,uc)try{if(a.ctrlKey||112<=a.keyCode&&123>=a.keyCode)a.keyCode=-1}catch(b){}};var G=function(a,b){this.a=0;this.i=void 0;this.f=this.b=this.c=null;this.g=this.h=!1;if(a!=ba)try{var c=this;a.call(b,function(a){yc(c,2,a)},function(a){if(!(a instanceof zc))try{if(a instanceof Error)throw a;throw Error("Promise rejected.");}catch(e){}yc(c,3,a)})}catch(d){yc(this,3,d)}},Ac=function(){this.next=this.f=this.c=this.b=this.a=null;this.g=!1};Ac.prototype.reset=function(){this.f=this.c=this.b=this.a=null;this.g=!1};
var Bc=new za(function(){return new Ac},function(a){a.reset()},100),Cc=function(a,b,c){var d=Bc.get();d.b=a;d.c=b;d.f=c;return d},Dc=function(a){if(a instanceof G)return a;var b=new G(ba);yc(b,2,a);return b},Ec=function(a){return new G(function(b,c){c(a)})};
G.prototype.then=function(a,b,c){null!=a&&eb(a,"opt_onFulfilled should be a function.");null!=b&&eb(b,"opt_onRejected should be a function. Did you pass opt_context as the second argument instead of the third?");return Fc(this,t(a)?a:null,t(b)?b:null,c)};Ha(G);G.prototype.l=function(a,b){return Fc(this,null,a,b)};G.prototype.cancel=function(a){0==this.a&&qc(function(){var b=new zc(a);Gc(this,b)},this)};
var Gc=function(a,b){if(0==a.a)if(a.c){var c=a.c;if(c.b){for(var d=0,e=null,f=null,g=c.b;g&&(g.g||(d++,g.a==a&&(e=g),!(e&&1<d)));g=g.next)e||(f=g);e&&(0==c.a&&1==d?Gc(c,b):(f?(d=f,B(c.b),B(null!=d),d.next==c.f&&(c.f=d),d.next=d.next.next):Hc(c),Ic(c,e,3,b)))}a.c=null}else yc(a,3,b)},Kc=function(a,b){a.b||2!=a.a&&3!=a.a||Jc(a);B(null!=b.b);a.f?a.f.next=b:a.b=b;a.f=b},Fc=function(a,b,c,d){var e=Cc(null,null,null);e.a=new G(function(a,g){e.b=b?function(c){try{var e=b.call(d,c);a(e)}catch(q){g(q)}}:a;
e.c=c?function(b){try{var e=c.call(d,b);!n(e)&&b instanceof zc?g(b):a(e)}catch(q){g(q)}}:g});e.a.c=a;Kc(a,e);return e.a};G.prototype.o=function(a){B(1==this.a);this.a=0;yc(this,2,a)};G.prototype.m=function(a){B(1==this.a);this.a=0;yc(this,3,a)};
var yc=function(a,b,c){if(0==a.a){a===c&&(b=3,c=new TypeError("Promise cannot resolve to itself"));a.a=1;var d;a:{var e=c,f=a.o,g=a.m;if(e instanceof G)null!=f&&eb(f,"opt_onFulfilled should be a function."),null!=g&&eb(g,"opt_onRejected should be a function. Did you pass opt_context as the second argument instead of the third?"),Kc(e,Cc(f||ba,g||null,a)),d=!0;else if(Ia(e))e.then(f,g,a),d=!0;else{if(ea(e))try{var h=e.then;if(t(h)){Lc(e,h,f,g,a);d=!0;break a}}catch(m){g.call(a,m);d=!0;break a}d=!1}}d||
(a.i=c,a.a=b,a.c=null,Jc(a),3!=b||c instanceof zc||Mc(a,c))}},Lc=function(a,b,c,d,e){var f=!1,g=function(a){f||(f=!0,c.call(e,a))},h=function(a){f||(f=!0,d.call(e,a))};try{b.call(a,g,h)}catch(m){h(m)}},Jc=function(a){a.h||(a.h=!0,qc(a.j,a))},Hc=function(a){var b=null;a.b&&(b=a.b,a.b=b.next,b.next=null);a.b||(a.f=null);null!=b&&B(null!=b.b);return b};G.prototype.j=function(){for(var a;a=Hc(this);)Ic(this,a,this.a,this.i);this.h=!1};
var Ic=function(a,b,c,d){if(3==c&&b.c&&!b.g)for(;a&&a.g;a=a.c)a.g=!1;if(b.a)b.a.c=null,Nc(b,c,d);else try{b.g?b.b.call(b.f):Nc(b,c,d)}catch(e){Oc.call(null,e)}Aa(Bc,b)},Nc=function(a,b,c){2==b?a.b.call(a.f,c):a.c&&a.c.call(a.f,c)},Mc=function(a,b){a.g=!0;qc(function(){a.g&&Oc.call(null,b)})},Oc=Vb,zc=function(a){z.call(this,a)};v(zc,z);zc.prototype.name="cancel";var Qc=function(a){this.a=new F;if(a){a=Tb(a);for(var b=a.length,c=0;c<b;c++){var d=a[c];this.a.set(Pc(d),d)}}},Pc=function(a){var b=typeof a;return"object"==b&&a||"function"==b?"o"+(a[fa]||(a[fa]=++ga)):b.substr(0,1)+a};Qc.prototype.b=function(){return this.a.b()};Qc.prototype.A=function(){return this.a.A()};Qc.prototype.h=function(){return this.a.h(!1)};var Rc=function(a){return function(){var b=[];Array.prototype.push.apply(b,arguments);Dc(!0).then(function(){a.apply(null,b)})}};var Sc="closure_lm_"+(1E6*Math.random()|0),Tc={},Uc=0,Vc=function(a,b,c,d,e){if("array"==p(b)){for(var f=0;f<b.length;f++)Vc(a,b[f],c,d,e);return null}c=Wc(c);a&&a[gb]?(Xc(a),a=Kb(a.b,String(b),c,!1,d,e)):a=Yc(a,b,c,!1,d,e);return a},Yc=function(a,b,c,d,e,f){if(!b)throw Error("Invalid event type");var g=!!e,h=Zc(a);h||(a[Sc]=h=new Ib(a));c=Kb(h,b,c,d,e,f);if(c.a)return c;d=$c();c.a=d;d.src=a;d.listener=c;if(a.addEventListener)a.addEventListener(b.toString(),d,g);else if(a.attachEvent)a.attachEvent(ad(b.toString()),
d);else throw Error("addEventListener and attachEvent are unavailable.");Uc++;return c},$c=function(){var a=bd,b=tc?function(c){return a.call(b.src,b.listener,c)}:function(c){c=a.call(b.src,b.listener,c);if(!c)return c};return b},cd=function(a,b,c,d,e){if("array"==p(b))for(var f=0;f<b.length;f++)cd(a,b[f],c,d,e);else c=Wc(c),a&&a[gb]?Kb(a.b,String(b),c,!0,d,e):Yc(a,b,c,!0,d,e)},dd=function(a,b,c,d,e){if("array"==p(b))for(var f=0;f<b.length;f++)dd(a,b[f],c,d,e);else(c=Wc(c),a&&a[gb])?(a=a.b,b=String(b).toString(),
b in a.a&&(f=a.a[b],c=Jb(f,c,d,e),-1<c&&(Eb(f[c]),B(null!=f.length),Array.prototype.splice.call(f,c,1),0==f.length&&(delete a.a[b],a.b--)))):a&&(a=Zc(a))&&(b=a.a[b.toString()],a=-1,b&&(a=Jb(b,c,!!d,e)),(c=-1<a?b[a]:null)&&ed(c))},ed=function(a){if("number"!=typeof a&&a&&!a.N){var b=a.src;if(b&&b[gb])Lb(b.b,a);else{var c=a.type,d=a.a;b.removeEventListener?b.removeEventListener(c,d,a.U):b.detachEvent&&b.detachEvent(ad(c),d);Uc--;(c=Zc(b))?(Lb(c,a),0==c.b&&(c.src=null,b[Sc]=null)):Eb(a)}}},ad=function(a){return a in
Tc?Tc[a]:Tc[a]="on"+a},gd=function(a,b,c,d){var e=!0;if(a=Zc(a))if(b=a.a[b.toString()])for(b=b.concat(),a=0;a<b.length;a++){var f=b[a];f&&f.U==c&&!f.N&&(f=fd(f,d),e=e&&!1!==f)}return e},fd=function(a,b){var c=a.listener,d=a.M||a.src;a.T&&ed(a);return c.call(d,b)},bd=function(a,b){if(a.N)return!0;if(!tc){if(!b)a:{b=["window","event"];for(var c=l,d;d=b.shift();)if(null!=c[d])c=c[d];else{b=null;break a}b=c}d=b;b=new xc(d,this);c=!0;if(!(0>d.keyCode||void 0!=d.returnValue)){a:{var e=!1;if(0==d.keyCode)try{d.keyCode=
-1;break a}catch(g){e=!0}if(e||void 0==d.returnValue)d.returnValue=!0}d=[];for(e=b.a;e;e=e.parentNode)d.push(e);a=a.type;for(e=d.length-1;0<=e;e--){b.a=d[e];var f=gd(d[e],a,!0,b),c=c&&f}for(e=0;e<d.length;e++)b.a=d[e],f=gd(d[e],a,!1,b),c=c&&f}return c}return fd(a,new xc(b,this))},Zc=function(a){a=a[Sc];return a instanceof Ib?a:null},hd="__closure_events_fn_"+(1E9*Math.random()>>>0),Wc=function(a){B(a,"Listener can not be null.");if(t(a))return a;B(a.handleEvent,"An object listener must have handleEvent method.");
a[hd]||(a[hd]=function(b){return a.handleEvent(b)});return a[hd]};var H=function(a,b){fb.call(this);this.m=a||0;this.f=b||10;if(this.m>this.f)throw Error("[goog.structs.Pool] Min can not be greater than max");this.a=new Rb;this.c=new Qc;this.j=null;this.S()};v(H,fb);H.prototype.W=function(){var a=ja();if(!(null!=this.j&&0>a-this.j)){for(var b;0<this.a.b()&&(b=Sb(this.a),!this.l(b));)this.S();!b&&this.b()<this.f&&(b=this.i());b&&(this.j=a,this.c.a.set(Pc(b),b));return b}};var jd=function(a){var b=id;wc(b.c.a,Pc(a))&&b.$(a)};
H.prototype.$=function(a){wc(this.c.a,Pc(a));this.l(a)&&this.b()<this.f?this.a.a.push(a):kd(a)};H.prototype.S=function(){for(var a=this.a;this.b()<this.m;){var b=this.i();a.a.push(b)}for(;this.b()>this.f&&0<this.a.b();)kd(Sb(a))};H.prototype.i=function(){return{}};var kd=function(a){if("function"==typeof a.ea)a.ea();else for(var b in a)a[b]=null};H.prototype.l=function(a){return"function"==typeof a.oa?a.oa():!0};H.prototype.b=function(){return this.a.b()+this.c.b()};
H.prototype.D=function(){H.I.D.call(this);if(0<this.c.b())throw Error("[goog.structs.Pool] Objects not released");delete this.c;for(var a=this.a;0!=a.c.length||0!=a.a.length;)kd(Sb(a));delete this.a};/*
 Portions of this code are from MochiKit, received by
 The Closure Authors under the MIT license. All other code is Copyright
 2005-2009 The Closure Authors. All Rights Reserved.
*/
var ld=function(a,b){this.g=[];this.u=a;this.s=b||null;this.f=this.a=!1;this.b=void 0;this.l=this.o=this.i=!1;this.h=0;this.c=null;this.j=0};
ld.prototype.cancel=function(a){if(this.a)this.b instanceof ld&&this.b.cancel();else{if(this.c){var b=this.c;delete this.c;a?b.cancel(a):(b.j--,0>=b.j&&b.cancel())}this.u?this.u.call(this.s,this):this.l=!0;if(!this.a){a=new md;if(this.a){if(!this.l)throw new nd;this.l=!1}B(!(a instanceof ld),"An execution sequence may not be initiated with a blocking Deferred.");this.a=!0;this.b=a;this.f=!0;od(this)}}};ld.prototype.m=function(a,b){this.i=!1;this.a=!0;this.b=b;this.f=!a;od(this)};
var pd=function(a,b,c){B(!a.o,"Blocking Deferreds can not be re-used");a.g.push([b,c,void 0]);a.a&&od(a)};ld.prototype.then=function(a,b,c){var d,e,f=new G(function(a,b){d=a;e=b});pd(this,d,function(a){a instanceof md?f.cancel():e(a)});return f.then(a,b,c)};Ha(ld);
var qd=function(a){return rb(a.g,function(a){return t(a[1])})},od=function(a){if(a.h&&a.a&&qd(a)){var b=a.h,c=rd[b];c&&(l.clearTimeout(c.a),delete rd[b]);a.h=0}a.c&&(a.c.j--,delete a.c);for(var b=a.b,d=c=!1;a.g.length&&!a.i;){var e=a.g.shift(),f=e[0],g=e[1],e=e[2];if(f=a.f?g:f)try{var h=f.call(e||a.s,b);n(h)&&(a.f=a.f&&(h==b||h instanceof Error),a.b=b=h);if(Ia(b)||"function"===typeof l.Promise&&b instanceof l.Promise)d=!0,a.i=!0}catch(m){b=m,a.f=!0,qd(a)||(c=!0)}}a.b=b;d&&(h=u(a.m,a,!0),d=u(a.m,a,
!1),b instanceof ld?(pd(b,h,d),b.o=!0):b.then(h,d));c&&(b=new sd(b),rd[b.a]=b,a.h=b.a)},nd=function(){z.call(this)};v(nd,z);nd.prototype.message="Deferred has already fired";nd.prototype.name="AlreadyCalledError";var md=function(){z.call(this)};v(md,z);md.prototype.message="Deferred was canceled";md.prototype.name="CanceledError";var sd=function(a){this.a=l.setTimeout(u(this.c,this),0);this.b=a};
sd.prototype.c=function(){B(rd[this.a],"Cannot throw an error that is not scheduled.");delete rd[this.a];throw this.b;};var rd={};var td=function(a){this.f=a;this.b=this.c=this.a=null},ud=function(a,b){this.name=a;this.value=b};ud.prototype.toString=function(){return this.name};var vd=new ud("SEVERE",1E3),wd=new ud("CONFIG",700),xd=new ud("FINE",500),yd=function(a){if(a.c)return a.c;if(a.a)return yd(a.a);db("Root logger has no level set.");return null};
td.prototype.log=function(a,b,c){if(a.value>=yd(this).value)for(t(b)&&(b=b()),a=new Ba(a,String(b),this.f),c&&(a.a=c),c="log:"+a.b,l.console&&(l.console.timeStamp?l.console.timeStamp(c):l.console.markTimeline&&l.console.markTimeline(c)),l.msWriteProfilerMark&&l.msWriteProfilerMark(c),c=this;c;)c=c.a};
var zd={},Ad=null,Bd=function(a){Ad||(Ad=new td(""),zd[""]=Ad,Ad.c=wd);var b;if(!(b=zd[a])){b=new td(a);var c=a.lastIndexOf("."),d=a.substr(c+1),c=Bd(a.substr(0,c));c.b||(c.b={});c.b[d]=b;b.a=c;zd[a]=b}return b};var Cd=function(){fb.call(this);this.b=new Ib(this);this.Y=this;this.G=null};v(Cd,fb);Cd.prototype[gb]=!0;Cd.prototype.removeEventListener=function(a,b,c,d){dd(this,a,b,c,d)};
var I=function(a,b){Xc(a);var c,d=a.G;if(d){c=[];for(var e=1;d;d=d.G)c.push(d),B(1E3>++e,"infinite loop")}a=a.Y;d=b.type||b;r(b)?b=new Cb(b,a):b instanceof Cb?b.target=b.target||a:(e=b,b=new Cb(d,a),Ga(b,e));var e=!0,f;if(c)for(var g=c.length-1;0<=g;g--)f=b.a=c[g],e=Dd(f,d,!0,b)&&e;f=b.a=a;e=Dd(f,d,!0,b)&&e;e=Dd(f,d,!1,b)&&e;if(c)for(g=0;g<c.length;g++)f=b.a=c[g],e=Dd(f,d,!1,b)&&e};
Cd.prototype.D=function(){Cd.I.D.call(this);if(this.b){var a=this.b,b=0,c;for(c in a.a){for(var d=a.a[c],e=0;e<d.length;e++)++b,Eb(d[e]);delete a.a[c];a.b--}}this.G=null};var Dd=function(a,b,c,d){b=a.b.a[String(b)];if(!b)return!0;b=b.concat();for(var e=!0,f=0;f<b.length;++f){var g=b[f];if(g&&!g.N&&g.U==c){var h=g.listener,m=g.M||g.src;g.T&&Lb(a.b,g);e=!1!==h.call(m,d)&&e}}return e&&0!=d.ja},Xc=function(a){B(a.b,"Event target is not initialized. Did you call the superclass (goog.events.EventTarget) constructor?")};var J=function(a,b){this.h=new $b;H.call(this,a,b)};v(J,H);k=J.prototype;k.W=function(a,b){if(!a)return J.I.W.call(this);Qb(this.h,n(b)?b:100,a);this.aa()};k.aa=function(){for(var a=this.h;0<a.b();){var b=this.W();if(b){var c;var d=a,e=d.a,f=e.length;c=e[0];if(0>=f)c=void 0;else{if(1==f)vb(e);else{e[0]=e.pop();for(var e=0,d=d.a,f=d.length,g=d[e];e<f>>1;){var h=2*e+1,m=2*e+2,h=m<f&&d[m].a<d[h].a?m:h;if(d[h].a>g.a)break;d[e]=d[h];e=h}d[e]=g}c=c.b}c.apply(this,[b])}else break}};
k.$=function(a){J.I.$.call(this,a);this.aa()};k.S=function(){J.I.S.call(this);this.aa()};k.D=function(){J.I.D.call(this);l.clearTimeout(void 0);vb(this.h.a);this.h=null};var K=function(a,b){a&&a.log(xd,b,void 0)};var Ed=function(a,b,c){if(t(a))c&&(a=u(a,c));else if(a&&"function"==typeof a.handleEvent)a=u(a.handleEvent,a);else throw Error("Invalid listener argument");return 2147483647<Number(b)?-1:l.setTimeout(a,b||0)};var L=function(a){Cd.call(this);this.headers=new F;this.B=a||null;this.c=!1;this.u=this.a=null;this.L=this.l="";this.K=0;this.h="";this.f=this.C=this.j=this.F=!1;this.i=0;this.m=null;this.R="";this.s=this.ca=this.X=!1};v(L,Cd);var Fd=L.prototype,Gd=Bd("goog.net.XhrIo");Fd.w=Gd;var Hd=/^https?$/i,Id=["POST","PUT"];
L.prototype.send=function(a,b,c,d){if(this.a)throw Error("[goog.net.XhrIo] Object is active with another request="+this.l+"; newUri="+a);b=b?b.toUpperCase():"GET";this.l=a;this.h="";this.K=0;this.L=b;this.F=!1;this.c=!0;this.a=this.B?this.B.a():Mb.a();this.u=this.B?mb(this.B):mb(Mb);this.a.onreadystatechange=u(this.P,this);this.ca&&"onprogress"in this.a&&(this.a.onprogress=u(function(a){this.O(a,!0)},this),this.a.upload&&(this.a.upload.onprogress=u(this.O,this)));try{K(this.w,M(this,"Opening Xhr")),
this.C=!0,this.a.open(b,String(a),!0),this.C=!1}catch(f){K(this.w,M(this,"Error opening Xhr: "+f.message));Jd(this,f);return}a=c||"";var e=new F(this.headers);d&&Ub(d,function(a,b){e.set(b,a)});d=tb(e.H());c=l.FormData&&a instanceof l.FormData;!ub(Id,b)||d||c||e.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");e.forEach(function(a,b){this.a.setRequestHeader(b,a)},this);this.R&&(this.a.responseType=this.R);"withCredentials"in this.a&&this.a.withCredentials!==this.X&&(this.a.withCredentials=
this.X);try{Kd(this),0<this.i&&(this.s=Ld(this.a),K(this.w,M(this,"Will abort after "+this.i+"ms if incomplete, xhr2 "+this.s)),this.s?(this.a.timeout=this.i,this.a.ontimeout=u(this.J,this)):this.m=Ed(this.J,this.i,this)),K(this.w,M(this,"Sending request")),this.j=!0,this.a.send(a),this.j=!1}catch(f){K(this.w,M(this,"Send error: "+f.message)),Jd(this,f)}};var Ld=function(a){return D&&E(9)&&"number"==typeof a.timeout&&n(a.ontimeout)},sb=function(a){return"content-type"==a.toLowerCase()};
L.prototype.J=function(){"undefined"!=typeof aa&&this.a&&(this.h="Timed out after "+this.i+"ms, aborting",this.K=8,K(this.w,M(this,this.h)),I(this,"timeout"),this.abort(8))};var Jd=function(a,b){a.c=!1;a.a&&(a.f=!0,a.a.abort(),a.f=!1);a.h=b;a.K=5;Md(a);Nd(a)},Md=function(a){a.F||(a.F=!0,I(a,"complete"),I(a,"error"))};L.prototype.abort=function(a){this.a&&this.c&&(K(this.w,M(this,"Aborting")),this.c=!1,this.f=!0,this.a.abort(),this.f=!1,this.K=a||7,I(this,"complete"),I(this,"abort"),Nd(this))};
L.prototype.D=function(){this.a&&(this.c&&(this.c=!1,this.f=!0,this.a.abort(),this.f=!1),Nd(this,!0));L.I.D.call(this)};L.prototype.P=function(){this.g||(this.C||this.j||this.f?Od(this):this.Z())};L.prototype.Z=function(){Od(this)};
var Od=function(a){if(a.c&&"undefined"!=typeof aa)if(a.u[1]&&4==Pd(a)&&2==N(a))K(a.w,M(a,"Local request error detected and ignored"));else if(a.j&&4==Pd(a))Ed(a.P,0,a);else if(I(a,"readystatechange"),4==Pd(a)){K(a.w,M(a,"Request complete"));a.c=!1;try{if(Qd(a))I(a,"complete"),I(a,"success");else{a.K=6;var b;try{b=2<Pd(a)?a.a.statusText:""}catch(c){K(a.w,"Can not get status: "+c.message),b=""}a.h=b+" ["+N(a)+"]";Md(a)}}finally{Nd(a)}}};
L.prototype.O=function(a,b){B("progress"===a.type,"goog.net.EventType.PROGRESS is of the same type as raw XHR progress.");I(this,Rd(a,"progress"));I(this,Rd(a,b?"downloadprogress":"uploadprogress"))};
var Rd=function(a,b){return{type:b,lengthComputable:a.lengthComputable,loaded:a.loaded,total:a.total}},Nd=function(a,b){if(a.a){Kd(a);var c=a.a,d=a.u[0]?ba:null;a.a=null;a.u=null;b||I(a,"ready");try{c.onreadystatechange=d}catch(e){(a=a.w)&&a.log(vd,"Problem encountered resetting onreadystatechange: "+e.message,void 0)}}},Kd=function(a){a.a&&a.s&&(a.a.ontimeout=null);"number"==typeof a.m&&(l.clearTimeout(a.m),a.m=null)},Qd=function(a){var b=N(a),c;a:switch(b){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:c=
!0;break a;default:c=!1}if(!c){if(b=0===b)a=String(a.l).match(Fb)[1]||null,!a&&l.self&&l.self.location&&(a=l.self.location.protocol,a=a.substr(0,a.length-1)),b=!Hd.test(a?a.toLowerCase():"");c=b}return c},Pd=function(a){return a.a?a.a.readyState:0},N=function(a){try{return 2<Pd(a)?a.a.status:-1}catch(b){return-1}},Sd=function(a){try{return a.a?a.a.responseText:""}catch(b){return K(a.w,"Can not get responseText: "+b.message),""}},Td=function(a,b){if(a.a&&4==Pd(a))return a=a.a.getResponseHeader(b),
null===a?void 0:a},M=function(a,b){return b+" ["+a.L+" "+a.l+" "+N(a)+"]"};var Ud=function(a,b,c,d){this.s=a;this.u=!!d;J.call(this,b,c)};v(Ud,J);Ud.prototype.i=function(){var a=new L,b=this.s;b&&b.forEach(function(b,d){a.headers.set(d,b)});this.u&&(a.X=!0);return a};Ud.prototype.l=function(a){return!a.g&&!a.a};var id=new Ud;var Wd=function(a,b,c,d,e,f,g,h,m,q,Q){this.J=a;this.C=b;this.u=c;this.m=d;this.G=e.slice();this.o=f.slice();this.j=this.l=this.c=this.b=null;this.g=this.h=!1;this.s=g;this.i=h;this.f=q;this.L=Q;this.F=m;var P=this;this.B=new G(function(a,b){P.l=a;P.j=b;Vd(P)})},Xd=function(a,b,c){this.b=a;this.c=b;this.a=!!c},Vd=function(a){function b(a,b){b?a(!1,new Xd(!1,null,!0)):id.W(function(b){b.X=d.L;d.b=b;var c=null;null!==d.f&&(b.ca=!0,c=Vc(b,"uploadprogress",function(a){d.f(a.loaded,a.lengthComputable?
a.total:-1)}),b.ca=null!==d.f);b.send(d.J,d.C,d.m,d.u);cd(b,"complete",function(b){null!==c&&ed(c);d.b=null;b=b.target;var e=6===b.K&&100<=N(b),f=Qd(b)||e,e=N(b);if(!(f=!f))var g=d,f=500<=e&&600>e,h=ub([408,429],e),g=ub(g.o,e),f=f||h||g;f?(e=7===b.K,jd(b),a(!1,new Xd(!1,null,e))):(e=ub(d.G,e),a(!0,new Xd(e,b)))})})}function c(a,b){var c=d.l;a=d.j;var e=b.c;if(b.b)try{var f=d.s(e,Sd(e));n(f)?c(f):c()}catch(q){a(q)}else null!==e?(b=ma(),f=Sd(e),b.serverResponse=f,d.i?a(d.i(e,b)):a(b)):(b=b.a?d.g?qa():
na():new w("retry-limit-exceeded","Max retry time for operation exceeded, please try again."),a(b));jd(e)}var d=a;a.h?c(0,new Xd(!1,null,!0)):a.c=ka(b,c,a.F)};Wd.prototype.a=function(){return this.B};Wd.prototype.cancel=function(a){this.h=!0;this.g=a||!1;null!==this.c&&(0,this.c)(!1);null!==this.b&&this.b.abort()};
var Yd=function(a,b,c){var d=ab(a.b),d=a.i+d,e=a.headers?ta(a.headers):{};null!==b&&0<b.length&&(e.Authorization="Firebase "+b);e["X-Firebase-Storage-Version"]="webjs/"+("undefined"!==typeof firebase?firebase.SDK_VERSION:"AppManager");return new Wd(d,a.method,e,a.body,a.f,a.h,a.M,a.a,a.timeout,a.c,c)};var Zd=function(a){var b=l.BlobBuilder||l.WebKitBlobBuilder;if(n(b)){for(var b=new b,c=0;c<arguments.length;c++)b.append(arguments[c]);return b.getBlob()}b=xb(arguments);c=l.BlobBuilder||l.WebKitBlobBuilder;if(n(c)){for(var c=new c,d=0;d<b.length;d++)c.append(b[d],void 0);b=c.getBlob(void 0)}else if(n(l.Blob))b=new Blob(b,{});else throw Error("This browser doesn't seem to support creating Blobs");return b},$d=function(a,b,c){n(c)||(c=a.size);return a.webkitSlice?a.webkitSlice(b,c):a.mozSlice?a.mozSlice(b,
c):a.slice?cc&&!E("13.0")||dc&&!E("537.1")?(0>b&&(b+=a.size),0>b&&(b=0),0>c&&(c+=a.size),c<b&&(c=b),a.slice(b,c-b)):a.slice(b,c):null};var O=function(a,b){ya()&&a instanceof Blob?(this.v=a,b=a.size,a=a.type):(a instanceof ArrayBuffer?(b?this.v=new Uint8Array(a):(this.v=new Uint8Array(a.byteLength),this.v.set(new Uint8Array(a))),b=this.v.length):(b?this.v=a:(this.v=new Uint8Array(a.length),this.v.set(a)),b=a.length),a="");this.a=b;this.b=a};O.prototype.type=function(){return this.b};
O.prototype.slice=function(a,b){if(ya()&&this.v instanceof Blob)return a=$d(this.v,a,b),null===a?null:new O(a);a=new Uint8Array(this.v.buffer,a,b-a);return new O(a,!0)};
var ae=function(a){var b=[];Array.prototype.push.apply(b,arguments);if(ya())return b=qb(b,function(a){return a instanceof O?a.v:a}),new O(Zd.apply(null,b));var b=qb(b,function(a){return xa(a)?$a("raw",a).data.buffer:a.v.buffer}),c=0;ob(b,function(a){c+=a.byteLength});var d=new Uint8Array(c),e=0;ob(b,function(a){a=new Uint8Array(a);for(var b=0;b<a.length;b++)d[e++]=a[b]});return new O(d,!0)};var be=function(a){this.b=Ec(a)};be.prototype.a=function(){return this.b};be.prototype.cancel=function(){};var ce=function(){this.a={};this.b=Number.MIN_SAFE_INTEGER},de=function(a,b){function c(){delete e.a[d]}var d=a.b;a.b++;a.a[d]=b;var e=a;b.a().then(c,c)},ee=function(a){sa(a.a,function(a,c){c&&c.cancel(!0)});a.a={}};var fe=function(a,b,c,d){this.a=a;this.g=null;if(null!==this.a&&(a=this.a.options,y(a))){a=a.storageBucket||null;if(null==a)a=null;else{var e=null;try{e=Sa(a)}catch(f){}if(null!==e){if(""!==e.path)throw new w("invalid-default-bucket","Invalid default bucket '"+a+"'.");a=e.bucket}}this.g=a}this.l=b;this.j=c;this.i=d;this.c=12E4;this.b=6E4;this.h=new ce;this.f=!1},ge=function(a){return null!==a.a&&y(a.a.INTERNAL)&&y(a.a.INTERNAL.getToken)?a.a.INTERNAL.getToken().then(function(a){return y(a)?a.accessToken:
null},function(){return null}):Dc(null)};fe.prototype.bucket=function(){if(this.f)throw qa();return this.g};var R=function(a,b,c){if(a.f)return new be(qa());b=a.j(b,c,null===a.a);de(a.h,b);return b};var he=function(a,b){return b},S=function(a,b,c,d){this.c=a;this.b=b||a;this.writable=!!c;this.a=d||he},ie=null,je=function(){if(ie)return ie;var a=[];a.push(new S("bucket"));a.push(new S("generation"));a.push(new S("metageneration"));a.push(new S("name","fullPath",!0));var b=new S("name");b.a=function(a,b){return!xa(b)||2>b.length?b:Hb(b)};a.push(b);b=new S("size");b.a=function(a,b){return y(b)?+b:b};a.push(b);a.push(new S("timeCreated"));a.push(new S("updated"));a.push(new S("md5Hash",null,!0));
a.push(new S("cacheControl",null,!0));a.push(new S("contentDisposition",null,!0));a.push(new S("contentEncoding",null,!0));a.push(new S("contentLanguage",null,!0));a.push(new S("contentType",null,!0));a.push(new S("metadata","customMetadata",!0));a.push(new S("downloadTokens","downloadURLs",!1,function(a,b){if(!(xa(b)&&0<b.length))return[];var c=encodeURIComponent;return qb(b.split(","),function(b){var d=a.fullPath,d="https://firebasestorage.googleapis.com/v0"+("/b/"+c(a.bucket)+"/o/"+c(d));b=ab({alt:"media",
token:b});return d+b})}));return ie=a},ke=function(a,b){Object.defineProperty(a,"ref",{get:function(){return b.l(b,new Qa(a.bucket,a.fullPath))}})},le=function(a,b){for(var c={},d=b.length,e=0;e<d;e++){var f=b[e];f.writable&&(c[f.c]=a[f.b])}return JSON.stringify(c)},me=function(a){if(!a||"object"!==typeof a)throw"Expected Metadata object.";for(var b in a){var c=a[b];if("customMetadata"===b&&"object"!==typeof c)throw"Expected object for 'customMetadata' mapping.";}};var T=function(a,b,c){for(var d=b.length,e=b.length,f=0;f<b.length;f++)if(b[f].b){d=f;break}if(!(d<=c.length&&c.length<=e))throw d===e?(b=d,d=1===d?"argument":"arguments"):(b="between "+d+" and "+e,d="arguments"),new w("invalid-argument-count","Invalid argument count in `"+a+"`: Expected "+b+" "+d+", received "+c.length+".");for(f=0;f<c.length;f++)try{b[f].a(c[f])}catch(g){if(g instanceof Error)throw pa(f,a,g.message);throw pa(f,a,g);}},U=function(a,b){var c=this;this.a=function(b){c.b&&!n(b)||a(b)};
this.b=!!b},ne=function(a,b){return function(c){a(c);b(c)}},oe=function(a,b){function c(a){if(!("string"===typeof a||a instanceof String))throw"Expected string.";}var d;a?d=ne(c,a):d=c;return new U(d,b)},pe=function(){return new U(function(a){if(!(a instanceof Uint8Array||a instanceof ArrayBuffer||ya()&&a instanceof Blob))throw"Expected Blob or File.";})},qe=function(){return new U(function(a){if(!(("number"===typeof a||a instanceof Number)&&0<=a))throw"Expected a number 0 or greater.";})},re=function(a,
b){return new U(function(b){if(!(null===b||y(b)&&b instanceof Object))throw"Expected an Object.";y(a)&&a(b)},b)},se=function(){return new U(function(a){if(null!==a&&!t(a))throw"Expected a Function.";},!0)};var te=function(a){if(!a)throw ma();},ue=function(a,b){return function(c,d){a:{var e;try{e=JSON.parse(d)}catch(h){c=null;break a}c=ea(e)?e:null}if(null===c)c=null;else{d={type:"file"};e=b.length;for(var f=0;f<e;f++){var g=b[f];d[g.b]=g.a(d,c[g.c])}ke(d,a);c=d}te(null!==c);return c}},ve=function(a){return function(b,c){b=401===N(b)?new w("unauthenticated","User is not authenticated, please authenticate using Firebase Authentication and try again."):402===N(b)?new w("quota-exceeded","Quota for bucket '"+
a.bucket+"' exceeded, please view quota on https://firebase.google.com/pricing/."):403===N(b)?new w("unauthorized","User does not have permission to access '"+a.path+"'."):c;b.serverResponse=c.serverResponse;return b}},we=function(a){var b=ve(a);return function(c,d){var e=b(c,d);404===N(c)&&(e=new w("object-not-found","Object '"+a.path+"' does not exist."));e.serverResponse=d.serverResponse;return e}},xe=function(a,b,c){var d=Ra(b);a=new x(la+"/v0"+d,"GET",ue(a,c),a.c);a.a=we(b);return a},ye=function(a,
b){var c=Ra(b);a=new x(la+"/v0"+c,"DELETE",function(){},a.c);a.f=[200,204];a.a=we(b);return a},ze=function(a,b,c){c=c?ta(c):{};c.fullPath=a.path;c.size=b.a;c.contentType||(a=b&&b.type()||"application/octet-stream",c.contentType=a);return c},Ae=function(a,b,c,d,e){var f="/b/"+encodeURIComponent(b.bucket)+"/o",g={"X-Goog-Upload-Protocol":"multipart"},h;h="";for(var m=0;2>m;m++)h+=Math.random().toString().slice(2);g["Content-Type"]="multipart/related; boundary="+h;e=ze(b,d,e);m=le(e,c);d=ae("--"+h+"\r\nContent-Type: application/json; charset=utf-8\r\n\r\n"+
m+"\r\n--"+h+"\r\nContent-Type: "+e.contentType+"\r\n\r\n",d,"\r\n--"+h+"--");if(null===d)throw oa();a=new x(la+"/v0"+f,"POST",ue(a,c),a.b);a.b={name:e.fullPath};a.headers=g;a.body=d.v;a.a=ve(b);return a},Be=function(a,b,c,d){this.a=a;this.total=b;this.b=!!c;this.c=d||null},Ce=function(a,b){var c;try{c=Td(a,"X-Goog-Upload-Status")}catch(d){te(!1)}te(ub(b||["active"],c));return c},De=function(a,b,c,d,e){var f="/b/"+encodeURIComponent(b.bucket)+"/o",g=ze(b,d,e);e={name:g.fullPath};f=la+"/v0"+f;d={"X-Goog-Upload-Protocol":"resumable",
"X-Goog-Upload-Command":"start","X-Goog-Upload-Header-Content-Length":d.a,"X-Goog-Upload-Header-Content-Type":g.contentType,"Content-Type":"application/json; charset=utf-8"};c=le(g,c);a=new x(f,"POST",function(a){Ce(a);var b;try{b=Td(a,"X-Goog-Upload-URL")}catch(q){te(!1)}te(xa(b));return b},a.b);a.b=e;a.headers=d;a.body=c;a.a=ve(b);return a},Ee=function(a,b,c,d){a=new x(c,"POST",function(a){var b=Ce(a,["active","final"]),c;try{c=Td(a,"X-Goog-Upload-Size-Received")}catch(h){te(!1)}a=c;isFinite(a)&&
(a=String(a));a=r(a)?/^\s*-?0x/i.test(a)?parseInt(a,16):parseInt(a,10):NaN;te(!isNaN(a));return new Be(a,d.a,"final"===b)},a.b);a.headers={"X-Goog-Upload-Command":"query"};a.a=ve(b);a.g=!1;return a},Fe=function(a,b,c,d,e,f,g){var h=new Be(0,0);g?(h.a=g.a,h.total=g.total):(h.a=0,h.total=d.a);if(d.a!==h.total)throw new w("server-file-wrong-size","Server recorded incorrect upload file size, please retry the upload.");var m=g=h.total-h.a;0<e&&(m=Math.min(m,e));var q=h.a;e={"X-Goog-Upload-Command":m===
g?"upload, finalize":"upload","X-Goog-Upload-Offset":h.a};g=d.slice(q,q+m);if(null===g)throw oa();c=new x(c,"POST",function(a,c){var e=Ce(a,["active","final"]),g=h.a+m,Q=d.a,q;"final"===e?q=ue(b,f)(a,c):q=null;return new Be(g,Q,"final"===e,q)},b.b);c.headers=e;c.body=g.v;c.c=null;c.a=ve(a);c.g=!1;return c};var W=function(a,b,c,d,e,f){this.L=a;this.c=b;this.j=c;this.f=e;this.h=f||null;this.m=d;this.l=0;this.J=this.s=!1;this.F=[];this.Z=262144<this.f.a;this.b="running";this.a=this.u=this.g=null;this.i=1;var g=this;this.V=function(a){g.a=null;g.i=1;"storage/canceled"===a.code?(g.s=!0,Ge(g)):(g.g=a,V(g,"error"))};this.Y=function(a){g.a=null;"storage/canceled"===a.code?Ge(g):(g.g=a,V(g,"error"))};this.B=this.o=null;this.G=new G(function(a,b){g.o=a;g.B=b;He(g)});this.G.then(null,function(){})},He=function(a){"running"===
a.b&&null===a.a&&(a.Z?null===a.u?Ie(a):a.s?Je(a):a.J?Ke(a):Le(a):Me(a))},Ne=function(a,b){ge(a.c).then(function(c){switch(a.b){case "running":b(c);break;case "canceling":V(a,"canceled");break;case "pausing":V(a,"paused")}})},Ie=function(a){Ne(a,function(b){var c=De(a.c,a.j,a.m,a.f,a.h);a.a=R(a.c,c,b);a.a.a().then(function(b){a.a=null;a.u=b;a.s=!1;Ge(a)},this.V)})},Je=function(a){var b=a.u;Ne(a,function(c){var d=Ee(a.c,a.j,b,a.f);a.a=R(a.c,d,c);a.a.a().then(function(b){a.a=null;Oe(a,b.a);a.s=!1;b.b&&
(a.J=!0);Ge(a)},a.V)})},Le=function(a){var b=262144*a.i,c=new Be(a.l,a.f.a),d=a.u;Ne(a,function(e){var f;try{f=Fe(a.j,a.c,d,a.f,b,a.m,c)}catch(g){a.g=g;V(a,"error");return}a.a=R(a.c,f,e);a.a.a().then(function(b){33554432>262144*a.i&&(a.i*=2);a.a=null;Oe(a,b.a);b.b?(a.h=b.c,V(a,"success")):Ge(a)},a.V)})},Ke=function(a){Ne(a,function(b){var c=xe(a.c,a.j,a.m);a.a=R(a.c,c,b);a.a.a().then(function(b){a.a=null;a.h=b;V(a,"success")},a.Y)})},Me=function(a){Ne(a,function(b){var c=Ae(a.c,a.j,a.m,a.f,a.h);a.a=
R(a.c,c,b);a.a.a().then(function(b){a.a=null;a.h=b;Oe(a,a.f.a);V(a,"success")},a.V)})},Oe=function(a,b){var c=a.l;a.l=b;a.l>c&&Pe(a)},V=function(a,b){if(a.b!==b)switch(b){case "canceling":a.b=b;null!==a.a&&a.a.cancel();break;case "pausing":a.b=b;null!==a.a&&a.a.cancel();break;case "running":var c="paused"===a.b;a.b=b;c&&(Pe(a),He(a));break;case "paused":a.b=b;Pe(a);break;case "canceled":a.g=na();a.b=b;Pe(a);break;case "error":a.b=b;Pe(a);break;case "success":a.b=b,Pe(a)}},Ge=function(a){switch(a.b){case "pausing":V(a,
"paused");break;case "canceling":V(a,"canceled");break;case "running":He(a)}};W.prototype.C=function(){return new A(this.l,this.f.a,wa(this.b),this.h,this,this.L)};
W.prototype.O=function(a,b,c,d){function e(a){try{g(a);return}catch(P){}try{if(h(a),!(n(a.next)||n(a.error)||n(a.complete)))throw"";}catch(P){throw"Expected a function or an Object with one of `next`, `error`, `complete` properties.";}}function f(a){return function(b,c,d){null!==a&&T("on",a,arguments);var e=new Ta(b,c,d);Qe(m,e);return function(){wb(m.F,e)}}}var g=se().a,h=re(null,!0).a;T("on",[oe(function(){if("state_changed"!==a)throw"Expected one of the event types: [state_changed].";}),re(e,!0),
se(),se()],arguments);var m=this,q=[re(function(a){if(null===a)throw"Expected a function or an Object with one of `next`, `error`, `complete` properties.";e(a)}),se(),se()];return n(b)||n(c)||n(d)?f(null)(b,c,d):f(q)};W.prototype.then=function(a,b){return this.G.then(a,b)};
var Qe=function(a,b){a.F.push(b);Re(a,b)},Pe=function(a){Se(a);var b=xb(a.F);ob(b,function(b){Re(a,b)})},Se=function(a){if(null!==a.o){var b=!0;switch(wa(a.b)){case "success":Rc(a.o.bind(null,a.C()))();break;case "canceled":case "error":Rc(a.B.bind(null,a.g))();break;default:b=!1}b&&(a.o=null,a.B=null)}},Re=function(a,b){switch(wa(a.b)){case "running":case "paused":null!==b.next&&Rc(b.next.bind(b,a.C()))();break;case "success":null!==b.b&&Rc(b.b.bind(b))();break;case "canceled":case "error":null!==
b.a&&Rc(b.a.bind(b,a.g))();break;default:null!==b.a&&Rc(b.a.bind(b,a.g))()}};W.prototype.R=function(){T("resume",[],arguments);var a="paused"===this.b||"pausing"===this.b;a&&V(this,"running");return a};W.prototype.P=function(){T("pause",[],arguments);var a="running"===this.b;a&&V(this,"pausing");return a};W.prototype.cancel=function(){T("cancel",[],arguments);var a="running"===this.b||"pausing"===this.b;a&&V(this,"canceling");return a};var X=function(a,b){this.b=a;if(b)this.a=b instanceof Qa?b:Sa(b);else if(a=a.bucket(),null!==a)this.a=new Qa(a,"");else throw new w("no-default-bucket","No default bucket found. Did you set the 'storageBucket' property when initializing the app?");};X.prototype.toString=function(){T("toString",[],arguments);return"gs://"+this.a.bucket+"/"+this.a.path};var Te=function(a,b){return new X(a,b)};k=X.prototype;
k.fa=function(a){T("child",[oe()],arguments);var b=Gb(this.a.path,a);return Te(this.b,new Qa(this.a.bucket,b))};k.Da=function(){var a;a=this.a.path;if(0==a.length)a=null;else{var b=a.lastIndexOf("/");a=-1===b?"":a.slice(0,b)}return null===a?null:Te(this.b,new Qa(this.a.bucket,a))};k.Fa=function(){return Te(this.b,new Qa(this.a.bucket,""))};k.ma=function(){return this.a.bucket};k.ya=function(){return this.a.path};k.Ca=function(){return Hb(this.a.path)};k.Ha=function(){return this.b.i};
k.ra=function(a,b){T("put",[pe(),new U(me,!0)],arguments);Ue(this,"put");return new W(this,this.b,this.a,je(),new O(a),b)};k.sa=function(a,b,c){T("putString",[oe(),oe(Va,!0),new U(me,!0)],arguments);Ue(this,"putString");var d=$a(y(b)?b:"raw",a),e=c?ta(c):{};!y(e.contentType)&&y(d.a)&&(e.contentType=d.a);return new W(this,this.b,this.a,je(),new O(d.data,!0),e)};
k.delete=function(){T("delete",[],arguments);Ue(this,"delete");var a=this;return ge(this.b).then(function(b){var c=ye(a.b,a.a);return R(a.b,c,b).a()})};k.ga=function(){T("getMetadata",[],arguments);Ue(this,"getMetadata");var a=this;return ge(this.b).then(function(b){var c=xe(a.b,a.a,je());return R(a.b,c,b).a()})};
k.ta=function(a){T("updateMetadata",[new U(me,void 0)],arguments);Ue(this,"updateMetadata");var b=this;return ge(this.b).then(function(c){var d=b.b,e=b.a,f=a,g=je(),h=Ra(e),h=la+"/v0"+h,f=le(f,g),d=new x(h,"PATCH",ue(d,g),d.c);d.headers={"Content-Type":"application/json; charset=utf-8"};d.body=f;d.a=we(e);return R(b.b,d,c).a()})};
k.qa=function(){T("getDownloadURL",[],arguments);Ue(this,"getDownloadURL");return this.ga().then(function(a){a=a.downloadURLs[0];if(y(a))return a;throw new w("no-download-url","The given file does not have any download URLs.");})};var Ue=function(a,b){if(""===a.a.path)throw new w("invalid-root-operation","The operation '"+b+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').");};var Y=function(a){this.a=new fe(a,function(a,c){return new X(a,c)},Yd,this);this.b=a;this.c=new Ve(this)};k=Y.prototype;k.ua=function(a){T("ref",[oe(function(a){if(/^[A-Za-z]+:\/\//.test(a))throw"Expected child path but got a URL, use refFromURL instead.";},!0)],arguments);var b=new X(this.a);return n(a)?b.fa(a):b};
k.va=function(a){T("refFromURL",[oe(function(a){if(!/^[A-Za-z]+:\/\//.test(a))throw"Expected full URL but got a child path, use ref instead.";try{Sa(a)}catch(c){throw"Expected valid full URL but got an invalid one.";}},!1)],arguments);return new X(this.a,a)};k.Aa=function(){return this.a.b};k.xa=function(a){T("setMaxUploadRetryTime",[qe()],arguments);this.a.b=a};k.za=function(){return this.a.c};k.wa=function(a){T("setMaxOperationRetryTime",[qe()],arguments);this.a.c=a};k.la=function(){return this.b};
k.ka=function(){return this.c};var Ve=function(a){this.a=a};Ve.prototype.delete=function(){var a=this.a.a;a.f=!0;a.a=null;ee(a.h)};var Z=function(a,b,c){Object.defineProperty(a,b,{get:c})};X.prototype.toString=X.prototype.toString;X.prototype.child=X.prototype.fa;X.prototype.put=X.prototype.ra;X.prototype.putString=X.prototype.sa;X.prototype["delete"]=X.prototype.delete;X.prototype.getMetadata=X.prototype.ga;X.prototype.updateMetadata=X.prototype.ta;X.prototype.getDownloadURL=X.prototype.qa;Z(X.prototype,"parent",X.prototype.Da);Z(X.prototype,"root",X.prototype.Fa);Z(X.prototype,"bucket",X.prototype.ma);
Z(X.prototype,"fullPath",X.prototype.ya);Z(X.prototype,"name",X.prototype.Ca);Z(X.prototype,"storage",X.prototype.Ha);Y.prototype.ref=Y.prototype.ua;Y.prototype.refFromURL=Y.prototype.va;Z(Y.prototype,"maxOperationRetryTime",Y.prototype.za);Y.prototype.setMaxOperationRetryTime=Y.prototype.wa;Z(Y.prototype,"maxUploadRetryTime",Y.prototype.Aa);Y.prototype.setMaxUploadRetryTime=Y.prototype.xa;Z(Y.prototype,"app",Y.prototype.la);Z(Y.prototype,"INTERNAL",Y.prototype.ka);Ve.prototype["delete"]=Ve.prototype.delete;
Y.prototype.capi_=function(a){la=a};W.prototype.on=W.prototype.O;W.prototype.resume=W.prototype.R;W.prototype.pause=W.prototype.P;W.prototype.cancel=W.prototype.cancel;Z(W.prototype,"snapshot",W.prototype.C);Z(A.prototype,"bytesTransferred",A.prototype.na);Z(A.prototype,"totalBytes",A.prototype.Ja);Z(A.prototype,"state",A.prototype.Ga);Z(A.prototype,"metadata",A.prototype.Ba);Z(A.prototype,"downloadURL",A.prototype.pa);Z(A.prototype,"task",A.prototype.Ia);Z(A.prototype,"ref",A.prototype.Ea);
ua.STATE_CHANGED="state_changed";va.RUNNING="running";va.PAUSED="paused";va.SUCCESS="success";va.CANCELED="canceled";va.ERROR="error";Ua.RAW="raw";Ua.BASE64="base64";Ua.BASE64URL="base64url";Ua.DATA_URL="data_url";G.prototype["catch"]=G.prototype.l;G.prototype.then=G.prototype.then;
(function(){function a(a){return new Y(a)}var b={TaskState:va,TaskEvent:ua,StringFormat:Ua,Storage:Y,Reference:X};if("undefined"!==typeof firebase)firebase.INTERNAL.registerService("storage",a,b);else throw Error("Cannot install Firebase Storage - be sure to load firebase-app.js first.");})();})();
module.exports = firebase.storage;

},{"./app":4}],10:[function(require,module,exports){
/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */

(function(global){

  // Passing in seed will seed this Noise instance
  function Noise(seed) {
    function Grad(x, y, z) {
      this.x = x; this.y = y; this.z = z;
    }

    Grad.prototype.dot2 = function(x, y) {
      return this.x*x + this.y*y;
    };

    Grad.prototype.dot3 = function(x, y, z) {
      return this.x*x + this.y*y + this.z*z;
    };

    this.grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
                 new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
                 new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

    this.p = [151,160,137,91,90,15,
    131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
    190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
    88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
    102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
    135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
    5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
    223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
    129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
    251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
    49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    // To remove the need for index wrapping, double the permutation table length
    this.perm = new Array(512);
    this.gradP = new Array(512);

    this.seed(seed || 0);
  }

  // This isn't a very good seeding function, but it works ok. It supports 2^16
  // different seed values. Write something better if you need more seeds.
  Noise.prototype.seed = function(seed) {
    if(seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if(seed < 256) {
      seed |= seed << 8;
    }

    var p = this.p;
    for(var i = 0; i < 256; i++) {
      var v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed>>8) & 255);
      }

      var perm = this.perm;
      var gradP = this.gradP;
      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = this.grad3[v % 12];
    }
  };

  /*
  for(var i=0; i<256; i++) {
    perm[i] = perm[i + 256] = p[i];
    gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
  }*/

  // Skewing and unskewing factors for 2, 3, and 4 dimensions
  var F2 = 0.5*(Math.sqrt(3)-1);
  var G2 = (3-Math.sqrt(3))/6;

  var F3 = 1/3;
  var G3 = 1/6;

  // 2D simplex noise
  Noise.prototype.simplex2 = function(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin)*F2; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var t = (i+j)*G2;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1=1; j1=0;
    } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1=0; j1=1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;

    var perm = this.perm;
    var gradP = this.gradP;
    var gi0 = gradP[i+perm[j]];
    var gi1 = gradP[i+i1+perm[j+j1]];
    var gi2 = gradP[i+1+perm[j+1]];
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0*x0-y0*y0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1*x1-y1*y1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2*x2-y2*y2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  };

  // 3D simplex noise
  Noise.prototype.simplex3 = function(xin, yin, zin) {
    var n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin+zin)*F3; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var k = Math.floor(zin+s);

    var t = (i+j+k)*G3;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    var z0 = zin-k+t;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    if(x0 >= y0) {
      if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    var x1 = x0 - i1 + G3; // Offsets for second corner
    var y1 = y0 - j1 + G3;
    var z1 = z0 - k1 + G3;

    var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
    var y2 = y0 - j2 + 2 * G3;
    var z2 = z0 - k2 + 2 * G3;

    var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
    var y3 = y0 - 1 + 3 * G3;
    var z3 = z0 - 1 + 3 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    i &= 255;
    j &= 255;
    k &= 255;

    var perm = this.perm;
    var gradP = this.gradP;
    var gi0 = gradP[i+   perm[j+   perm[k   ]]];
    var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
    var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
    var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];

    // Calculate the contribution from the four corners
    var t0 = 0.5 - x0*x0-y0*y0-z0*z0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1*x1-y1*y1-z1*z1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    var t2 = 0.5 - x2*x2-y2*y2-z2*z2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    var t3 = 0.5 - x3*x3-y3*y3-z3*z3;
    if(t3<0) {
      n3 = 0;
    } else {
      t3 *= t3;
      n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 32 * (n0 + n1 + n2 + n3);

  };

  // ##### Perlin noise stuff

  function fade(t) {
    return t*t*t*(t*(t*6-15)+10);
  }

  function lerp(a, b, t) {
    return (1-t)*a + t*b;
  }

  // 2D Perlin Noise
  Noise.prototype.perlin2 = function(x, y) {
    // Find unit grid cell containing point
    var X = Math.floor(x), Y = Math.floor(y);
    // Get relative xy coordinates of point within that cell
    x = x - X; y = y - Y;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    var perm = this.perm;
    var gradP = this.gradP;
    var n00 = gradP[X+perm[Y]].dot2(x, y);
    var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
    var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
    var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);

    // Compute the fade curve value for x
    var u = fade(x);

    // Interpolate the four results
    return lerp(
        lerp(n00, n10, u),
        lerp(n01, n11, u),
       fade(y));
  };

  // 3D Perlin Noise
  Noise.prototype.perlin3 = function(x, y, z) {
    // Find unit grid cell containing point
    var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    // Get relative xyz coordinates of point within that cell
    x = x - X; y = y - Y; z = z - Z;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255; Z = Z & 255;

    // Calculate noise contributions from each of the eight corners
    var perm = this.perm;
    var gradP = this.gradP;
    var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,     z);
    var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
    var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
    var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
    var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
    var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
    var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
    var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);

    // Compute the fade curve value for x, y, z
    var u = fade(x);
    var v = fade(y);
    var w = fade(z);

    // Interpolate
    return lerp(
        lerp(
          lerp(n000, n100, u),
          lerp(n001, n101, u), w),
        lerp(
          lerp(n010, n110, u),
          lerp(n011, n111, u), w),
       v);
  };

  global.Noise = Noise;

})(typeof module === "undefined" ? this : module.exports);

},{}],11:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],12:[function(require,module,exports){
var process=require("__browserify_process");/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */

var TWEEN = TWEEN || (function () {

	var _tweens = [];

	return {

		getAll: function () {

			return _tweens;

		},

		removeAll: function () {

			_tweens = [];

		},

		add: function (tween) {

			_tweens.push(tween);

		},

		remove: function (tween) {

			var i = _tweens.indexOf(tween);

			if (i !== -1) {
				_tweens.splice(i, 1);
			}

		},

		update: function (time, preserve) {

			if (_tweens.length === 0) {
				return false;
			}

			var i = 0;

			time = time !== undefined ? time : TWEEN.now();

			while (i < _tweens.length) {

				if (_tweens[i].update(time) || preserve) {
					i++;
				} else {
					_tweens.splice(i, 1);
				}

			}

			return true;

		}
	};

})();


// Include a performance.now polyfill
(function () {
	// In node.js, use process.hrtime.
	if (this.window === undefined && this.process !== undefined) {
		TWEEN.now = function () {
			var time = process.hrtime();

			// Convert [seconds, microseconds] to milliseconds.
			return time[0] * 1000 + time[1] / 1000;
		};
	}
	// In a browser, use window.performance.now if it is available.
	else if (this.window !== undefined &&
	         window.performance !== undefined &&
		 window.performance.now !== undefined) {

		// This must be bound, because directly assigning this function
		// leads to an invocation exception in Chrome.
		TWEEN.now = window.performance.now.bind(window.performance);
	}
	// Use Date.now if it is available.
	else if (Date.now !== undefined) {
		TWEEN.now = Date.now;
	}
	// Otherwise, use 'new Date().getTime()'.
	else {
		TWEEN.now = function () {
			return new Date().getTime();
		};
	}
})();


TWEEN.Tween = function (object) {

	var _object = object;
	var _valuesStart = {};
	var _valuesEnd = {};
	var _valuesStartRepeat = {};
	var _duration = 1000;
	var _repeat = 0;
	var _yoyo = false;
	var _isPlaying = false;
	var _reversed = false;
	var _delayTime = 0;
	var _startTime = null;
	var _easingFunction = TWEEN.Easing.Linear.None;
	var _interpolationFunction = TWEEN.Interpolation.Linear;
	var _chainedTweens = [];
	var _onStartCallback = null;
	var _onStartCallbackFired = false;
	var _onUpdateCallback = null;
	var _onCompleteCallback = null;
	var _onStopCallback = null;

	// Set all starting values present on the target object
	for (var field in object) {
		_valuesStart[field] = parseFloat(object[field], 10);
	}

	this.to = function (properties, duration) {

		if (duration !== undefined) {
			_duration = duration;
		}

		_valuesEnd = properties;

		return this;

	};

	this.start = function (time) {

		TWEEN.add(this);

		_isPlaying = true;

		_onStartCallbackFired = false;

		_startTime = time !== undefined ? time : TWEEN.now();
		_startTime += _delayTime;

		for (var property in _valuesEnd) {

			// Check if an Array was provided as property value
			if (_valuesEnd[property] instanceof Array) {

				if (_valuesEnd[property].length === 0) {
					continue;
				}

				// Create a local copy of the Array with the start value at the front
				_valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);

			}

			// If `to()` specifies a property that doesn't exist in the source object,
			// we should not set that property in the object
			if (_valuesStart[property] === undefined) {
				continue;
			}

			_valuesStart[property] = _object[property];

			if ((_valuesStart[property] instanceof Array) === false) {
				_valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
			}

			_valuesStartRepeat[property] = _valuesStart[property] || 0;

		}

		return this;

	};

	this.stop = function () {

		if (!_isPlaying) {
			return this;
		}

		TWEEN.remove(this);
		_isPlaying = false;

		if (_onStopCallback !== null) {
			_onStopCallback.call(_object);
		}

		this.stopChainedTweens();
		return this;

	};

	this.stopChainedTweens = function () {

		for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
			_chainedTweens[i].stop();
		}

	};

	this.delay = function (amount) {

		_delayTime = amount;
		return this;

	};

	this.repeat = function (times) {

		_repeat = times;
		return this;

	};

	this.yoyo = function (yoyo) {

		_yoyo = yoyo;
		return this;

	};


	this.easing = function (easing) {

		_easingFunction = easing;
		return this;

	};

	this.interpolation = function (interpolation) {

		_interpolationFunction = interpolation;
		return this;

	};

	this.chain = function () {

		_chainedTweens = arguments;
		return this;

	};

	this.onStart = function (callback) {

		_onStartCallback = callback;
		return this;

	};

	this.onUpdate = function (callback) {

		_onUpdateCallback = callback;
		return this;

	};

	this.onComplete = function (callback) {

		_onCompleteCallback = callback;
		return this;

	};

	this.onStop = function (callback) {

		_onStopCallback = callback;
		return this;

	};

	this.update = function (time) {

		var property;
		var elapsed;
		var value;

		if (time < _startTime) {
			return true;
		}

		if (_onStartCallbackFired === false) {

			if (_onStartCallback !== null) {
				_onStartCallback.call(_object);
			}

			_onStartCallbackFired = true;

		}

		elapsed = (time - _startTime) / _duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		value = _easingFunction(elapsed);

		for (property in _valuesEnd) {

			// Don't update properties that do not exist in the source object
			if (_valuesStart[property] === undefined) {
				continue;
			}

			var start = _valuesStart[property] || 0;
			var end = _valuesEnd[property];

			if (end instanceof Array) {

				_object[property] = _interpolationFunction(end, value);

			} else {

				// Parses relative end values with start as base (e.g.: +10, -3)
				if (typeof (end) === 'string') {

					if (end.charAt(0) === '+' || end.charAt(0) === '-') {
						end = start + parseFloat(end, 10);
					} else {
						end = parseFloat(end, 10);
					}
				}

				// Protect against non numeric properties.
				if (typeof (end) === 'number') {
					_object[property] = start + (end - start) * value;
				}

			}

		}

		if (_onUpdateCallback !== null) {
			_onUpdateCallback.call(_object, value);
		}

		if (elapsed === 1) {

			if (_repeat > 0) {

				if (isFinite(_repeat)) {
					_repeat--;
				}

				// Reassign starting values, restart by making startTime = now
				for (property in _valuesStartRepeat) {

					if (typeof (_valuesEnd[property]) === 'string') {
						_valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property], 10);
					}

					if (_yoyo) {
						var tmp = _valuesStartRepeat[property];

						_valuesStartRepeat[property] = _valuesEnd[property];
						_valuesEnd[property] = tmp;
					}

					_valuesStart[property] = _valuesStartRepeat[property];

				}

				if (_yoyo) {
					_reversed = !_reversed;
				}

				_startTime = time + _delayTime;

				return true;

			} else {

				if (_onCompleteCallback !== null) {
					_onCompleteCallback.call(_object);
				}

				for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
					// Make the chained tweens start exactly at the time they should,
					// even if the `update()` method was called way past the duration of the tween
					_chainedTweens[i].start(_startTime + _duration);
				}

				return false;

			}

		}

		return true;

	};

};


TWEEN.Easing = {

	Linear: {

		None: function (k) {

			return k;

		}

	},

	Quadratic: {

		In: function (k) {

			return k * k;

		},

		Out: function (k) {

			return k * (2 - k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k;
			}

			return - 0.5 * (--k * (k - 2) - 1);

		}

	},

	Cubic: {

		In: function (k) {

			return k * k * k;

		},

		Out: function (k) {

			return --k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k + 2);

		}

	},

	Quartic: {

		In: function (k) {

			return k * k * k * k;

		},

		Out: function (k) {

			return 1 - (--k * k * k * k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k;
			}

			return - 0.5 * ((k -= 2) * k * k * k - 2);

		}

	},

	Quintic: {

		In: function (k) {

			return k * k * k * k * k;

		},

		Out: function (k) {

			return --k * k * k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k * k * k + 2);

		}

	},

	Sinusoidal: {

		In: function (k) {

			return 1 - Math.cos(k * Math.PI / 2);

		},

		Out: function (k) {

			return Math.sin(k * Math.PI / 2);

		},

		InOut: function (k) {

			return 0.5 * (1 - Math.cos(Math.PI * k));

		}

	},

	Exponential: {

		In: function (k) {

			return k === 0 ? 0 : Math.pow(1024, k - 1);

		},

		Out: function (k) {

			return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if ((k *= 2) < 1) {
				return 0.5 * Math.pow(1024, k - 1);
			}

			return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

		}

	},

	Circular: {

		In: function (k) {

			return 1 - Math.sqrt(1 - k * k);

		},

		Out: function (k) {

			return Math.sqrt(1 - (--k * k));

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return - 0.5 * (Math.sqrt(1 - k * k) - 1);
			}

			return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);

		},

		Out: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			k *= 2;

			if (k < 1) {
				return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
			}

			return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;

		}

	},

	Back: {

		In: function (k) {

			var s = 1.70158;

			return k * k * ((s + 1) * k - s);

		},

		Out: function (k) {

			var s = 1.70158;

			return --k * k * ((s + 1) * k + s) + 1;

		},

		InOut: function (k) {

			var s = 1.70158 * 1.525;

			if ((k *= 2) < 1) {
				return 0.5 * (k * k * ((s + 1) * k - s));
			}

			return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

		}

	},

	Bounce: {

		In: function (k) {

			return 1 - TWEEN.Easing.Bounce.Out(1 - k);

		},

		Out: function (k) {

			if (k < (1 / 2.75)) {
				return 7.5625 * k * k;
			} else if (k < (2 / 2.75)) {
				return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
			} else if (k < (2.5 / 2.75)) {
				return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
			} else {
				return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
			}

		},

		InOut: function (k) {

			if (k < 0.5) {
				return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
			}

			return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.Linear;

		if (k < 0) {
			return fn(v[0], v[1], f);
		}

		if (k > 1) {
			return fn(v[m], v[m - 1], m - f);
		}

		return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

	},

	Bezier: function (v, k) {

		var b = 0;
		var n = v.length - 1;
		var pw = Math.pow;
		var bn = TWEEN.Interpolation.Utils.Bernstein;

		for (var i = 0; i <= n; i++) {
			b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
		}

		return b;

	},

	CatmullRom: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.CatmullRom;

		if (v[0] === v[m]) {

			if (k < 0) {
				i = Math.floor(f = m * (1 + k));
			}

			return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

		} else {

			if (k < 0) {
				return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
			}

			if (k > 1) {
				return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
			}

			return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

		}

	},

	Utils: {

		Linear: function (p0, p1, t) {

			return (p1 - p0) * t + p0;

		},

		Bernstein: function (n, i) {

			var fc = TWEEN.Interpolation.Utils.Factorial;

			return fc(n) / fc(i) / fc(n - i);

		},

		Factorial: (function () {

			var a = [1];

			return function (n) {

				var s = 1;

				if (a[n]) {
					return a[n];
				}

				for (var i = n; i > 1; i--) {
					s *= i;
				}

				a[n] = s;
				return s;

			};

		})(),

		CatmullRom: function (p0, p1, p2, p3, t) {

			var v0 = (p2 - p0) * 0.5;
			var v1 = (p3 - p1) * 0.5;
			var t2 = t * t;
			var t3 = t * t2;

			return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

		}

	}

};

// UMD (Universal Module Definition)
(function (root) {

	if (typeof define === 'function' && define.amd) {

		// AMD
		define([], function () {
			return TWEEN;
		});

	} else if (typeof module !== 'undefined' && typeof exports === 'object') {

		// Node.js
		module.exports = TWEEN;

	} else if (root !== undefined) {

		// Global variable
		root.TWEEN = TWEEN;

	}

})(this);

},{"__browserify_process":11}],13:[function(require,module,exports){
var Faces = require('./faces');

var canvas = document.querySelector('canvas');

var drawFace = Faces(canvas);

function draw(time) {
  drawFace(time);
  requestAnimationFrame(draw);
}

draw(0);

},{"./faces":15}],14:[function(require,module,exports){
var Noise = require('noisejs').Noise;
var dat = require('dat-gui');
var firebase = require('firebase');
var TWEEN = require('tween.js');

var config = {
  apiKey: "AIzaSyARob6Peh7tIeue1ro1gHCuDsDQhDjapH0",
  authDomain: "face-3c1e5.firebaseapp.com",
  databaseURL: "https://face-3c1e5.firebaseio.com",
  storageBucket: "face-3c1e5.appspot.com",
  messagingSenderId: "466860282"
};
firebase.initializeApp(config);
var facedb = firebase.database();

var maxEyeHeight = 0.25;
var maxEyeWidth = 0.25;
var maxEyeDistance = 0.4;
var maxMouthPos = 0.5;
var maxMouthHeight = 0.5;
var maxMouthWidth = 0.95;

var maxNoseHeight = 0.15;
var maxNoseWidth = 0.25;
var face = {
  eyeDistance : 0.5,
  leftEyeHeight : 0.5,
  leftEyeWidth : 0.5,
  rightEyeHeight : 0.5,
  rightEyeWidth : 0.5,
  leftPupilAngle : 0.0,
  leftPupilRadius : 0.0,
  leftPupilWidth: 0.5,
  rightPupilAngle : 0,
  rightPupilRadius : 0,
  rightPupilWidth: 0.5,
  noseHeight: 0.5,
  noseWidth: 0.5,
  mouthX : 0.5,
  mouthOpen : 0,
  mouthHeight: 0.5,
  mouthWidth: 0.5,
  sadness: 0.0
};

var control = {
  randomize: false,
  timestep: 0.1,
  weight: 0.0001
};

function FaceModel(faceHeight, faceWidth) {

  var eyeNoise = new Noise(Math.random());
  var noise = new Noise(Math.random());
  var gui = new dat.GUI();
  dat.GUI.toggleHide();

  var t = 0;


  faceRef = facedb.ref('face');
  faceRef.on('value', function(snapshot) {
    // newest value is king
    TWEEN.removeAll();
    var newFace = snapshot.val();
    var tween = new TWEEN.Tween(face)
      .to(newFace, 200)
      .easing(TWEEN.Easing.Quadratic.In)
      .start();
  });

  controlRef = facedb.ref('control');
  controlRef.on('value', function(snapshot) {
    Object.assign(control, snapshot.val());
  })

  // separate data from display
  function perlin1(x, y) {
    return control.weight * noise.perlin2(x, y);
  }

  gui.add(face, 'eyeDistance', 0, 1).listen();
  gui.add(face, 'leftEyeHeight', 0, 1).listen();
  gui.add(face, 'leftEyeWidth', 0, 1).listen();
  gui.add(face, 'rightEyeHeight', 0, 1).listen();
  gui.add(face, 'rightEyeWidth', 0, 1).listen();
  gui.add(face, 'leftPupilAngle', 0, 1).listen();
  gui.add(face, 'leftPupilRadius', 0, 1).listen();
  gui.add(face, 'leftPupilWidth', 0, 1).listen();
  gui.add(face, 'rightPupilAngle', 0, 1).listen();
  gui.add(face, 'rightPupilRadius', 0, 1).listen();
  gui.add(face, 'rightPupilWidth', 0, 1).listen();
  gui.add(face, 'noseHeight', 0, 1).listen();
  gui.add(face, 'noseWidth', 0, 1).listen();
  gui.add(face, 'mouthX', 0, 1).listen();
  gui.add(face, 'mouthHeight', 0, 1).listen();
  gui.add(face, 'mouthWidth', 0, 1).listen();
  gui.add(face, 'mouthOpen', 0, 1).listen();
  gui.add(face, 'sadness', -1.0, 1.0).listen();
  gui.add(control, 'randomize').listen();
  gui.add(control, 'timestep', 0, 10).listen();
  gui.add(control, 'weight', 0, 0.01).listen();

  // randomly walks the space of possible faces by using noise
  face.randomTick = function() {
    face.eyeDistance += perlin1(t/100, 0.35);
    face.leftEyeHeight += perlin1(t/100, 0.15);
    face.leftEyeWidth += perlin1(t/100, 0.2);
    face.rightEyeHeight += perlin1(t/100, 0.25);
    face.rightEyeWidth += perlin1(t/100, 0.3);
    face.leftPupilAngle += perlin1(t/100, 0.1);
    face.leftPupilRadius += perlin1(t/100, 0.92);
    face.leftPupilWidth += perlin1(t/100, 0.15)
    face.rightPupilAngle += perlin1(t/100, 0.1);
    face.rightPupilRadius += perlin1(t/100, 0.92);
    face.rightPupilWidth += perlin1(t/100, 0.15)
    face.noseWidth += perlin1(t/100, 0.65);
    face.noseHeight += perlin1(t/100, 0.35);
    face.mouthX += perlin1(t/100, 0.04);
    face.mouthHeight += perlin1(t/100, 0.75);
    face.mouthWidth += perlin1(t/100, 0.85);
    face.sadness += perlin1(t/100, 0.9);
    t += control.timestep;
  }

  // translates the face from normalised values to draw space values
  face.compute = function compute(time) {
    TWEEN.update(time);
    if (control.randomize) {
      face.randomTick();
    }
    var computedFace = {};
    computedFace.eyeDistance = maxEyeDistance * face.eyeDistance;
    computedFace.mouthHeight = maxMouthPos * face.mouthX;
    computedFace.leftEye = {
      x : (faceWidth * 0.5) - (faceWidth * computedFace.eyeDistance),
      y : faceHeight * 0.25,
      height: face.leftEyeHeight * faceHeight * maxEyeHeight,
      width: face.leftEyeWidth * faceWidth * maxEyeWidth
    };

    computedFace.rightEye = {
      x : (faceWidth * 0.5) + (faceWidth * computedFace.eyeDistance),
      y : faceHeight * 0.25,
      height: face.rightEyeHeight * faceHeight * maxEyeHeight,
      width: face.rightEyeWidth * faceWidth * maxEyeWidth
    };

    computedFace.leftPupil = {
      angle : 2 * Math.PI * face.leftPupilAngle,
      radius : face.leftPupilRadius * computedFace.leftEye.width,
      width : face.leftPupilWidth * computedFace.leftEye.width * 0.5
    };

    computedFace.rightPupil = {
      angle : 2 * Math.PI * face.rightPupilAngle,
      radius : face.rightPupilRadius * computedFace.rightEye.width,
      width : face.rightPupilWidth * computedFace.rightEye.width * 0.5
    };

    computedFace.nose = {
      x: faceWidth * 0.5,
      y: faceHeight * 0.5,
      height: face.noseHeight * faceHeight * maxNoseHeight,
      width: face.noseWidth * faceWidth * maxNoseWidth
    };

    computedFace.mouth = {
      x: faceWidth * 0.5,
      y: faceHeight * 0.5 + (faceHeight * 0.5 * face.mouthX),
      height: face.mouthHeight * faceHeight * maxMouthHeight,
      width: face.mouthWidth * faceWidth * maxMouthWidth,
      open: face.mouthOpen
    };
    computedFace.sadness = face.sadness;
    return computedFace
  }

  return face;
}

module.exports = FaceModel;

},{"dat-gui":1,"firebase":7,"noisejs":10,"tween.js":12}],15:[function(require,module,exports){
var FaceModel = require('./faceModel');

var faceHeight = 200;
var faceWidth = 200;

function backingScale(context) {
    if ('devicePixelRatio' in window) {
        if (window.devicePixelRatio > 1) {
            return window.devicePixelRatio;
        }
    }
    return 1;
}

function face(canvas) {

  var t = 0;

  var ctx = canvas.getContext('2d');

  var scaleFactor = backingScale(ctx);

  var w = (window.innerWidth) * 0.95;
  var h = (window.innerHeight) * 0.95;

  canvas.width = Math.min(w, h);
  canvas.height = Math.min(w, h);

  if (scaleFactor > 1) {
    canvas.width = canvas.width * scaleFactor;
    canvas.height = canvas.height * scaleFactor;

    ctx = canvas.getContext('2d');
  }

  faceHeight = canvas.height;
  faceWidth = canvas.width;

  var faceModel = FaceModel(faceHeight, faceWidth);

  function drawEyes(face) {
    ctx.lineWidth = faceWidth * 0.02;
    ctx.fillStyle = "#FAEFEE";
    ctx.beginPath();
    ctx.ellipse(face.leftEye.x, face.leftEye.y, face.leftEye.width, face.leftEye.height, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(face.rightEye.x, face.rightEye.y, face.rightEye.width, face.rightEye.height, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    // pupil
    var leftPupilX = face.leftEye.x + (Math.cos(face.leftPupil.angle) * face.leftPupil.radius);
    var rightPupilX = face.rightEye.x + (Math.cos(face.rightPupil.angle) * face.rightPupil.radius);
    var leftPupilY = face.leftEye.y + (Math.sin(face.leftPupil.angle) * face.leftPupil.radius);
    var rightPupilY = face.rightEye.y + (Math.sin(face.rightPupil.angle) * face.rightPupil.radius);
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.ellipse(leftPupilX, leftPupilY, face.leftPupil.width, face.leftPupil.width, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightPupilX, rightPupilY, face.rightPupil.width, face.rightPupil.width, 0, 0, 2*Math.PI);
    ctx.fill();
  }

  function drawNose(face) {
    var x = face.nose.x;
    var y = face.nose.y;
    ctx.beginPath();
    ctx.fillStyle="#ff4625";
    ctx.ellipse(x, y, face.nose.width, face.nose.height, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  function drawMouth(face) {
    if (face.mouth.open > 0.001) {
      drawOpenMouth(face);
    } else {
      drawClosedMouth(face);
    }
  }

  function drawOpenMouth(face) {
    var x = face.mouth.x;
    var y = face.mouth.y;
    ctx.beginPath();
    ctx.fillStyle="#100";
    ctx.ellipse(x, y, face.mouth.width/2, face.mouth.height*face.mouth.open, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  function drawClosedMouth(face) {
    var x = face.mouth.x;
    var y = face.mouth.y;
    var startX = x - (face.mouth.width / 2);
    var startY = y;
    var endX = x + (face.mouth.width / 2);
    var endY = y;
    var cp1x = startX + 10;
    var cp2x = endX - 10;
    var cp1y = y + (face.mouth.height * face.sadness);
    var cp2y = cp1y;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();
  }

  return function update(time) {
    ctx.clearRect(0, 0, canvas.height, canvas.width);
    var face = faceModel.compute(time);
    drawEyes(face);
    drawMouth(face);
    drawNose(face);
  }
}

module.exports = face;

},{"./faceModel":14}]},{},[13,14,15])
;