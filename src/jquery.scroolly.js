(function(root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // Set up jQuery.Scroolly appropriately for the environment. Start with AMD.
        define(['jquery'], function($) {
            // Export global even in AMD case in case this script is loaded with
            return factory(root, $, false);
        });

        return;
    }

    // Finally, as a browser global in jquery ns.
    factory(root, (root.jQuery || root.Zepto || root.ender || root.$), true);
}(this, function(root, $, patchJQuery) {
    "use strict";

    var scroolly;

    scroolly = {
        options: {
            timeout: null,
            meter: $('.scroolly'),
            body: document
        },
        theCSSPrefix: '',
        theDashedCSSPrefix: '',
        isMobile: false,
        isInitialized: false,
        //        requestAnimFrame: null,
        //        cancelAnimFrame: null,

        animFrame: null,
        direction: 0,
        scrollTop: 0,
        scrollCenter: 0,
        scrollBottom: 0,
        docHeight: 0,
        docMiddle: 0,
        winHeight: $(window).height()
    };

    scroolly.scrollLayout = {
        //  TSB - top screen border
        //        topbarSearchForm:{
        //            element: searchFormTop,
        //            rules:[
        //                {
        //                    from: 0, // top border of the rule region
        //                    to: 'finish', // bottom border of the rule region
        //                          // if ommited then set to 'from' of the following rule
        //                          // if there is no following rule set to 'bottom'
        //                    minWith: 0, // min viewport width for the rule to apply
        //                    maxWidth: 'infinity', // max viewport width for the rule to apply
        //                    direction: 0, // 0 - ignored, >0 - forward, <0 - backward
        //                    alias: 'top', // region alias
        //                    css: null,//{'display': 'none'}, // css to apply when TSB enters rule region
        //                    cssFrom: {'border': '0px solid #000000'},
        //                    cssTo: {'border': '10px solid #eeeeee'},
        //                    addClass: null,   // $.addClass() param value to add classes when TSB enters rule region
        //                    removeClass: null,    // $.removeClass() param value to remove classes when TSB enters rule region
        //                    onCheckIn: function(element){ // callback on TSB enters rule region
        //                        element
        //                        .hide('fade', 100);
        //                        searchInputMain.val(searchInputTop.val());
        //                    },
        //                    onCheckOut: function(element){} // callback on TSB leaves rule region
        //                    onTopIn: function(element){}  // callback on TSB enters rule region from the top border
        //                    onTopOut: function(element){}  // callback on TSB leaves rule region from the top border
        //                    onBottomIn: function(element){}  // callback on TSB enters rule region from the bottom border
        //                    onBottomOut: function(element){}  // callback on TSB leaves rule region from the bottom border
        //                    onScroll: function(element, offset, length){}  // callback on scroll event while TSB is in the rule region
        //                                      // offset - is the offset (px) of the TSB from the rule region top border
        //                                      // length - is the rule region size (px)
        //                    onDirectionChanged: function(element, direction){}
        //                },
        //                {
        //                    from: searchFormMain.offset().top,
        //                    alias: 'searchform',
        //                    css: null,//{'display': 'block'},
        //                    addClass: null,
        //                    removeClass: null,
        //                    onCheckIn: function(element){
        //                        element.show('fade', 300);
        //                        searchInputTop.val(searchInputMain.val());
        //                    },
        //                    onCheckOut: function(element){}
        //                }
        //            ]
        //        }

    };

    scroolly._isObject = function(val) {
        return typeof val === 'object';
    };

    scroolly._isArray = function(val) {
        return val instanceof Array;
    };

    scroolly._isNumber = function(val) {
        return val instanceof Number || typeof val === 'number';
    };

    scroolly._isString = function(val) {
        return val instanceof String || typeof val === 'string';
    };

    scroolly._default = function(obj, key, defaultValue) {
        if (defaultValue === undefined) {
            defaultValue = null;
        }
        var parts = (key + '').split('.');
        if (obj && (scroolly._isObject(obj) || scroolly._isArray(obj))) {
            var root = obj,
                    part;
            for (var i in parts) {
                part = parts[i];
                if ((scroolly._isObject(root) || scroolly._isArray(root)) && root[part] !== undefined) {
                    root = root[part];
                } else {
                    return defaultValue;
                }
            }
            return root;
        }

        return defaultValue;
        //        return _.empty(obj[key])?defaultValue:obj[key];
    };

    /**
     * Parse rule boundry
     * @param {string} boundry - '[anchor] [offset] = [vieport anchor] [offset]'
     * @return {object} - parsed boundry
     */
    scroolly.parseCoords = function(boundry) {
        var strings = boundry.split(/\s*=\s*/),
                coordRel = strings[0] || 'doc-top',
                parsedCoordRel = scroolly.parseCoord(coordRel),
                coordVP = strings[1] || parsedCoordRel.anchor,
                parsedCoordVP = scroolly.parseCoord(coordVP);

        return [parsedCoordRel, parsedCoordVP];
    };

    /**
     * Parse rule coord part
     * @param {string} coord - '[anchor] [offset]'
     * @return {object} - parsed boundry
     */
    scroolly.parseCoord = function(coord) {
        var reAnchor = /((vp|doc|el|con)-)?(top|center|bottom)?/i,
                reOffsetStr = '(\\+|-)?\\s*(\\d+)(\\%|vp|doc|el|con)?',
                reOffset = new RegExp(reOffsetStr, 'gi'),
                mA = coord.match(reAnchor),
                mO = coord.match(reOffset);

        if (!mA && !mO) {
            return false;
        }

        var subject = mA[1] ? mA[2] : 'vp',
                anchor = mA[3] || 'top',
                offsets = [];

        if (mO) {
            reOffset = new RegExp(reOffsetStr, 'i');
            var offsetStr,
                    mO2,
                    sign,
                    offset,
                    offsetSubject;

            for (var i = 0; i < mO.length; i++) {
                offsetStr = mO[i];
                mO2 = offsetStr.match(reOffset);
                sign = mO2[1] && mO2[1] === '-' ? -1 : 1;
                offset = mO2[2] && parseInt(mO2[2]) * sign || 0;
                offsetSubject = 'px';

                if (mO2[3]) {
                    offsetSubject = mO2[3] === '%' ? subject : mO2[3];
                }

                offsets.push({
                    offset: offset,
                    subject: offsetSubject
                });
            }
        }
        return {
            original: coord,
            subject: subject,
            anchor: anchor,
            offsets: offsets
        };

    };

    /**
     * Calculate coord position towards top of the document
     * @param {string} coord - '[anchor] [offset]'
     * @param {jQuery(element)} $element
     * @param {jQuery(container)} $container
     * @return {object} - parsed boundry
     */
    scroolly.calculateCoord = function(coord, $element, $container) {
        if (scroolly._isString(coord)) {
            coord = scroolly.parseCoord(coord);
        }

        var subjectCoord = 0;
        if ('vp' === coord.subject) {
            switch (coord.anchor) {
                case 'top':
                    subjectCoord = scroolly.scrollTop;
                    break;
                case 'center':
                    subjectCoord = scroolly.scrollCenter;
                    break;
                case 'bottom':
                    subjectCoord = scroolly.scrollBottom;
                    break;
            }
        } else if ('doc' === coord.subject) {
            switch (coord.anchor) {
                case 'top':
                    subjectCoord = 0;
                    break;
                case 'center':
                    subjectCoord = scroolly.docMiddle;
                    break;
                case 'bottom':
                    subjectCoord = scroolly.docHeight;
            }
        } else {
            var $subject = 'con' === coord.subject ? $container : $element,
                    subjectHeight = $subject.outerHeight(),
                    subjectTop = $subject.offset().top,
                    subjectBottom = subjectTop + subjectHeight,
                    subjectCenter = subjectTop + Math.floor(subjectHeight / 2);

            switch (coord.anchor) {
                case 'top':
                    subjectCoord = subjectTop;
                    break;
                case 'center':
                    subjectCoord = subjectCenter;
                    break;
                case 'bottom':
                    subjectCoord = subjectBottom;
                    break;
            }
        }

        var i, o, subjectOffset, relativeHeight;
        for (i = 0; i < coord.offsets.length; i++) {
            o = coord.offsets[i];
            subjectOffset = o.offset;

            if ('px' !== o.subject) {
                relativeHeight = 0;
                switch (o.subject) {
                    case 'vp':
                        relativeHeight = scroolly.winHeight;
                        break;
                    case 'doc':
                        relativeHeight = scroolly.docHeight;
                        break;
                    case 'el':
                        relativeHeight = $element.outerHeight();
                        break;
                    case 'con':
                        relativeHeight = $container.outerHeight();
                        break;
                }

                subjectOffset = Math.ceil(o.offset / 100 * relativeHeight);
                //                console.log(subjectOffset);
            }
            subjectCoord += subjectOffset;
        }

//        console.dir({'computed':{ags: arguments, res: subjectCoord}});

        return subjectCoord;
    };

    /**
     * Calculate how much we should scroll down till boundry
     * @param {Object} coords
     * @param {$(DOMnode)} $element
     * @param {$(DOMnode)} $container
     * @returns {integer} how much we should scroll down till boundry
     */
    scroolly.cmpCoords = function(coords, $element, $container) {
        return scroolly.calculateCoord(coords[0], $element, $container) - scroolly.calculateCoord(coords[1], $element, $container);
    };

    /**
     * Check if rule is active
     * @param {object} rule
     * @return {boolean}
     */
    scroolly.isRuleInActiveWidthRange = function(rule) {
        var fromX = scroolly._default(rule, 'minWidth', 0),
                toX = scroolly._default(rule, 'maxWidth', 'infinity'),
                meter = scroolly._default(scroolly.options, 'meter'),
                width = $(window).width(),
                minWidthScrolly,
                maxWidthScrolly,
                checkinWidth;

        if (meter.length) {
            minWidthScrolly = meter.length ? parseInt(meter.css('min-width')) : 0;
            maxWidthScrolly = meter.length ? meter.css('max-width') : 'none';
            maxWidthScrolly = maxWidthScrolly === 'none' ? 'infinity' : parseInt(maxWidthScrolly);
            checkinWidth = fromX <= minWidthScrolly && (toX === 'infinity' || toX >= maxWidthScrolly);

            return checkinWidth;
        }

        return fromX < width && (toX === 'infinity' || toX >= width);
    };

    /**
     * Check if rule is active
     *
     * @param {object} rule
     * @param {$(DOMnode)} $element
     * @param {$(DOMnode)|String} $container description
     * @returns {boolean|object} false if rule is not active or scrolling params instead
     * {
     *      offset: how many pixels since top boundry were scrolled
     *      length: total length of the region in pisels
     * }
     */
    scroolly.isRuleActive = function(rule, $element, $container) {
        var checkinWidth = scroolly.isRuleInActiveWidthRange(rule);
        if (!checkinWidth) {
            return false;
        }

        var ruleDirection = scroolly._default(rule, 'direction', 0),
                scrollDirection = scroolly.direction;

        if (ruleDirection && (ruleDirection > 0 && scrollDirection < 0 || ruleDirection < 0 && scrollDirection >= 0)) {
            return false;
        }

        var fromY = scroolly._default(rule, 'from', '0'),
                toY = scroolly._default(rule, 'to', 'finish');

        var toTop = scroolly.cmpCoords(fromY, $element, $container);
        if (toTop > 0) {
            return false;
        }

        var toBottom = scroolly.cmpCoords(toY, $element, $container);
        if (toBottom <= 0) {
            return false;
        }

        return {
            offset: -toTop,
            length: toBottom - toTop
        };
    };

    /**
     * Helper and polyfill for non-ECMA5 compliant browsers to get layout length
     * @returns {number} length of scrollLayout
     */
    scroolly.getScrollLayoutLength = function () {
        return (!Object.keys) ? $.map(scroolly.scrollLayout, function (){ return 1; }).length : Object.keys(scroolly.scrollLayout).length;
    };

    /**
     * Add ellement with its rules to scroll layout
     * See the commented sample above for the rules syntax
     *
     * @param {string} id
     * @param {$(DOMnode)} $element
     * @param {array} rules
     * @param {$(DOMnode)} $container description
     */
    scroolly.addItem = function(id, $element, rules, $container) {
        if (!$element.length) {
            return false;
        }

        $container = $container || 'self';

        var rule,
                isAbsolute,
                fromY,
                toY,
                fromCss,
                toCss,
                cssOnScroll;

        cssOnScroll = function(element, offset, length, rule) {
            var progress = offset / length,
                    fromCss = scroolly._default(rule, 'cssFrom'),
                    toCss = scroolly._default(rule, 'cssTo'),
                    css = {},
                    fromProp,
                    toProp;

            for (var property in fromCss) {
                fromProp = fromCss[property];
                toProp = scroolly._default(toCss, property, fromProp);
                css[property] = scroolly.getTransitionValue(fromProp, toProp, progress);
            }

            element.css(scroolly.extendCssWithPrefix(css));
        };

        for (var i in rules) {
            rule = rules[i];

            isAbsolute = !$container;//?true:false;

            fromY = scroolly._default(rule, 'from', 'doc-top');

            if (scroolly._isString(fromY) || scroolly._isNumber(fromY)) {
                fromY = scroolly.parseCoords('' + fromY);
                rule.from = fromY;
            }

            toY = scroolly._default(rule, 'to', 'doc-bottom');

            if (scroolly._isString(toY) || scroolly._isNumber(toY)) {
                toY = scroolly.parseCoords('' + toY);

                rule.to = toY;
            }

            fromCss = scroolly._default(rule, 'cssFrom');
            toCss = scroolly._default(rule, 'cssTo');

            if (fromCss && toCss) {

                rule.cssOnScroll = cssOnScroll;
            }
        }
        if ($element.length > 1) {
            $element.each(function(i) {
                var clonedRules = [],
                        rule,
                        clonedRule,
                        $con = null;

                for (var j = 0; j < rules.length; j++) {
                    rule = rules[j];
                    clonedRule = {};
                    $.extend(clonedRule, rule);
                    clonedRules.push(clonedRule);
                }

                if ($container) {
                    if ($container === 'self') {
                        $con = $container;
                    } else {
                        $con = $container.length > 1 && i < $container.length ? $($container[i]) : $container;
                    }
                }

                scroolly.addItem(id + '-' + i, $(this), clonedRules, $con);
            });

            return true;
        }
        var item = scroolly._default(scroolly.scrollLayout, id);
        if (item) {
            item.rules.concat(rules);
        } else {
            scroolly.scrollLayout[id] = {
                element: $element,
                container: $container,
                rules: rules
            };
        }
        return true;
    };

    scroolly.factory = function($element, rules, $container, id) {
        scroolly.init();

        if (!$element.length) {
            return false;
        }

        if (!rules) {
            return false;
        }

        id = id || $element[0].tagName + '_' + scroolly.getScrollLayoutLength();
        scroolly.addItem(id, $element, rules, $container, false);
    };

    /**
     * Fix DOM element in NON-Responsive (non viewport width dependent) layout.
     * When applied, DOMnode is fixed when TSB is within
     * (node's top border - offsetTop) and ($bottomContainer's bottom border - offsetBottom)
     * and unfixed when TSB is out of the region
     *
     * @param string id
     * @param $(DOMnode) $element
     * @param object params: {
     *      $bottomContainer - $(DOMnode) which restricts fix from the bottom,
     *          '<body>' by default,
     *          'next' means the next dom sibling $element.next()
     *          'parent' means $element.parent()
     *      mode - sets the mode of adding needed white space to $bottomContainer
     *          when $element is fixed
     *          'margin' means margin-top=$element.height() wil be added to $bottomContainer
     *          'padding' means padding-top=$element.height() wil be added to $bottomContainer
     *      offsetTop - top offset that is left before fixed element when fixed
     *      offsetBottom - bottom offset left before $bottomContainer
     *      minWidth, maxWidth - viewport width (px) boundries
     *          is used within stickItemXY for responsive layouts
     *          0, 'infinity' by default
     *      static -
     * }
     */
    scroolly.stickItem = function(id, $element, params /*$bottomContainer, mode, offsetTop, offsetBottom*/) {
        scroolly.stickItemXY(id, $element, (params instanceof Array) ? params : [params]);
    };

    /**
     * Fix DOM element in NON-Responsive (non viewport width dependent) layout.
     * When applied, DOMnode is fixed when TSB is within
     * (node's top border - offsetTop) and ($bottomContainer's bottom border - offsetBottom)
     * and unfixed when TSB is out of the region
     *
     * @param string id
     * @param $(DOMnode) $element
     * @param array params - array of objects described in stickItem()
     */
    scroolly.stickItemXY = function(id, $element, params /*$bottomContainer, mode, offsetTop, offsetBottom*/) {
        params = params || [];
        var rules = [],
                xRange,
                $bottomContainer,
                mode,
                offsetTop,
                offsetBottom,
                minWidth,
                maxWidth,
                isStatic
                ;
        for (var x in params) {
            xRange = params[x];
            $bottomContainer = scroolly._default(xRange, '$bottomContainer', $('body'));
            mode = scroolly._default(xRange, 'mode');
            offsetTop = scroolly._default(xRange, 'offsetTop', 0);
            offsetBottom = scroolly._default(xRange, 'offsetBottom', 0);
            minWidth = scroolly._default(xRange, 'minWidth', 0);
            maxWidth = scroolly._default(xRange, 'maxWidth', 'infinity');
            isStatic = scroolly._default(xRange, 'static', false);

            if ('next' === $bottomContainer) {
                mode = mode || 'margin';
                $bottomContainer = $($element).next();
            } else if ('parent' === $bottomContainer || !$bottomContainer) {
                mode = mode || 'padding';
                $bottomContainer = $($element).parent();
            }

            if (!isStatic) {
                rules.push({
                    source: 'sticky',
                    alias: 'top',
                    minWidth: minWidth,
                    maxWidth: maxWidth,
                    offsetTop: offsetTop,
                    offsetBottom: offsetBottom,
                    bottomContainer: $bottomContainer,
                    mode: mode
                });
                rules.push({
                    source: 'sticky',
                    alias: 'fixed',
                    minWidth: minWidth,
                    maxWidth: maxWidth,
                    offsetTop: offsetTop,
                    offsetBottom: offsetBottom,
                    bottomContainer: $bottomContainer,
                    mode: mode
                });

                rules.push({
                    source: 'sticky',
                    alias: 'bottom',
                    minWidth: minWidth,
                    maxWidth: maxWidth,
                    offsetTop: offsetTop,
                    offsetBottom: offsetBottom,
                    bottomContainer: $bottomContainer,
                    mode: mode
//                    from: offset_2,
//                    css: {'position': 'absolute', 'top':(offset_2+offsetTop)+'px'}
                });
            } else {
                rules.push({
                    source: 'sticky',
                    alias: 'static',
                    minWidth: minWidth,
                    maxWidth: maxWidth,
                    bottomContainer: $bottomContainer
                });
            }
        }

        scroolly.addItem(id, $($element), rules);
    };

    /**
     * This function calculates all rules boundries when browser is resized and
     * enters new width range. We cannot precalculate all sizes as during window
     * resize some element are resized.
     *
     * @param {$(DOMnode)} $element
     * @param {object} rule - single rule
     * @returns {object} - recalculated rule
     */
    scroolly.processStickyItemRange = function($element, rule) {
        rule = rule || {};

        var $bottomContainer = scroolly._default(rule, 'bottomContainer', $('body')),
                mode = scroolly._default(rule, 'mode'),
                offsetTop = scroolly._default(rule, 'offsetTop', 0),
                offsetBottom = scroolly._default(rule, 'offsetBottom', 0),
                itemHeight = parseInt($element.css('margin-top')) + $element.height() + parseInt($element.css('margin-bottom'));

        if ($element.css('box-sizing') === 'border-box') {
            itemHeight += parseInt($element.css('padding-top')) + parseInt($element.css('padding-bottom'));
        }

        var bottomContainerHeight = parseInt($bottomContainer.css('margin-top')) + $bottomContainer.height() + parseInt($bottomContainer.css('margin-bottom'));
        if ($bottomContainer.css('box-sizing') === 'border-box') {
            bottomContainerHeight += parseInt($bottomContainer.css('padding-top')) + parseInt($bottomContainer.css('padding-bottom'));
        }

        var offset_1 = Math.round($element.offset().top - parseInt($element.css('margin-top'))),
                offset_2 = Math.round($bottomContainer.offset().top + (bottomContainerHeight - itemHeight - offsetBottom));

        switch (rule.alias) {
            case 'top':
                rule.from = 0;
                rule.to = offset_1 - offsetTop;
                rule.css = {'position': 'absolute', 'top': offset_1 + 'px'};
                rule.itemHeight = itemHeight;
                break;

            case 'fixed':
                rule.from = offset_1 - offsetTop;
                rule.to = offset_2;
                rule.css = {'position': 'fixed', 'top': offsetTop + 'px'};
                rule.itemHeight = itemHeight;
                break;

            case 'bottom':
                rule.from = offset_2;
                rule.css = {'position': 'absolute', 'top': (offset_2 + offsetTop) + 'px'};
                rule.itemHeight = itemHeight;
                break;

            case 'static':
                rule.from = 0;
                rule.css = {'position': '', 'top': ''};
                rule.itemHeight = 0;
                break;
        }

        return rule;
    };

    /**
     * Heads up, this function is called on window resize. However even if window
     * has entered new width range it doesn't mean that new responsive styles were
     * allready applied. So we cannot rely on $( window ).width(). What we can rely
     * on are styles that are applied to some predefined element called 'meter'.
     *
     * Html: (our Meter)
     * <div class="scroolly"></div>
     *
     * CSS:
     *
     * .scroolly{
     *      display: none;
     * }
     *
     * media (min-device-width : 320px) and (max-device-width : 480px){
     *      .scroolly{
     *          min-width: 320px;
     *          max-width: 480px;
     *      }
     * }
     * media (min-device-width : 481px) and (max-device-width : 800px){
     *      .scroolly{
     *          min-width: 481px;
     *          max-width: 800px;
     *      }
     * }
     *
     * JS rules:
     *
     * {
     *      minWidth: 320,
     *      maxWidth: 480
     * },
     * {
     *      minWidth: 480,
     *      maxWidth: 800
     * }
     *
     * @returns {Boolean}
     */
    scroolly.onResize = function() {
        scroolly.winHeight = $(window).height();
        //        scroolly.docHeight = $(document).height();
        scroolly.docHeight = scroolly.body.height();
        scroolly.docMiddle = Math.floor(scroolly.docHeight / 2);

        var needScroll = false;

        for (var id in scroolly.scrollLayout) {
            // cycling through all visual elements that should react
            // to scrolling and resizing
            var item = scroolly.scrollLayout[id],
                    rule,
                    checkin,
                    source
                    ;
            for (var i in item.rules) {
                rule = item.rules[i];
                checkin = scroolly.isRuleInActiveWidthRange(rule);
                needScroll |= checkin;
                if (checkin && rule.from === undefined) {
                    $(item.element).css('position', '');
                    $(item.element).css('top', '');
                    if (rule.bottomContainer) {
                        rule.bottomContainer.css('margin-top', '');
                    }
                    // item entered new range and should adapt
                    source = scroolly._default(rule, 'source');
                    if ('sticky' === source) {
                        item.rules[i] = scroolly.processStickyItemRange(item.element, rule);
                    }

                }
            }
        }
        if (needScroll) {
            // dark magick here do not touch this useless string
            scroolly.scrollLayout = scroolly.scrollLayout;
            setTimeout(function() {
                scroolly.onScroll(true);
            }, 0);
            //            scroolly.onScroll();
        }
        return true;
    };

    /**
     * Helper to get progress values for onScroll handlers
     * @param {integer} offset
     * @param {integer} length
     * @returns {object} progress metrics
     */
    scroolly.getProgress = function(offset, length) {
        var relative = offset / length;
        return {
            offset: offset,
            length: length,
            relative: relative,
            left: length - offset,
            leftRelative: 1 - relative
        };
    };

    /**
     * Get transition float value  based on start, stop and progress values
     * @param {number} start
     * @param {number} stop
     * @param {float} progress
     * @returns {Number}
     */
    scroolly.getTransitionFloatValue = function(start, stop, progress) {
        if (progress <= 0) {
            return start;
        }

        if (progress >= 1) {
            return stop;
        }

        return start + (stop - start) * progress;
    };

    /**
     * Get transition integer value  based on start, stop and progress values
     * @param {number} start
     * @param {number} stop
     * @param {float} progress
     * @returns {Number}
     */
    scroolly.getTransitionIntValue = function(start, stop, progress) {
        return Math.round(scroolly.getTransitionFloatValue(start, stop, progress));
    };

    /**
     * Get [R, G, B] array of integers for provided '#RRGGBB' or '#RGB' value
     * @param {type} color
     * @returns {Array}
     */
    scroolly.hashColor2rgb = function(color) {
        var m = color.match(/^#([0-9a-f]{3})$/i);
        if (m) {
            // in three-character format, each value is multiplied by 0x11 to give an
            // even scale from 0x00 to 0xff
            return [
                parseInt(m[1].charAt(0), 16) * 0x11, parseInt(m[1].charAt(1), 16) * 0x11, parseInt(m[1].charAt(2), 16) * 0x11
            ];
        } else {
            m = color.match(/^#([0-9a-f]{6})$/i);
            if (m) {
                return [
                    parseInt(m[1].substr(0, 2), 16), parseInt(m[1].substr(2, 2), 16), parseInt(m[1].substr(4, 2), 16)
                ];
            }
        }
        return [0, 0, 0];
    };

    /**
     * Get '#RRGGBB' value for provided R, G, B integer values
     * @param {integer} r
     * @param {integer} g
     * @param {integer} b
     * @returns {string} #RRGGBB
     */
    scroolly.rgb2HashColor = function(r, g, b) {
        var res = '#', c, hex;
        for (var i in arguments) {
            c = arguments[i];
            hex = c.toString(16);

            if (c < 16) {
                hex = '0' + hex;
            }

            res += hex;
        }

        return res;
    };

    /**
     * Get transition color value  based on start, stop and progress values
     * @param {cssColor} start
     * @param {cssColor} stop
     * @param {float} progress
     * @returns {Number}
     */
    scroolly.getTransitionColorValue = function(start, stop, progress) {
        if (progress <= 0) {
            return start;
        }

        if (progress >= 1) {
            return stop;
        }

        var startRGB = scroolly.hashColor2rgb(start),
                stopRGB = scroolly.hashColor2rgb(stop),
                r = scroolly.getTransitionIntValue(startRGB[0], stopRGB[0], progress),
                g = scroolly.getTransitionIntValue(startRGB[1], stopRGB[1], progress),
                b = scroolly.getTransitionIntValue(startRGB[2], stopRGB[2], progress);

        return scroolly.rgb2HashColor(r, g, b);
    };

    /**
     * Get transition css value  based on start, stop and progress values
     * @param {cssColor} start
     * @param {cssColor} stop
     * @param {float} progress
     * @returns {Number}
     */
    scroolly.getTransitionValue = function(start, stop, progress) {
        if (progress <= 0) {
            return start;
        }

        if (progress >= 1) {
            return stop;
        }

        var called = 0;
        if (scroolly._isNumber(start) && scroolly._isNumber(stop)) {
            return scroolly.getTransitionFloatValue(start, stop, progress);
        }

        var re = /(\d*\.\d+)|(\d+)|(#[0-9a-f]{6})|(#[0-9a-f]{3})/gi,
                stops = ('' + stop).match(re);

        return ('' + start).replace(re, function(value, float, int, color6, color3) {
            //            console.dir({'replace callback args':arguments, stops: stops, called: called});
            var currentStop = stops[called];

            called++;
            if (int && int.length) {
                return /\d*\.\d+/.test(currentStop) ? scroolly.getTransitionFloatValue(parseFloat(value), parseFloat(currentStop), progress) : scroolly.getTransitionIntValue(parseInt(value), parseInt(currentStop), progress);
            }

            if (float && float.length) {
                return scroolly.getTransitionFloatValue(parseFloat(value), parseFloat(currentStop), progress);
            }

            if (color6 && color6.length || color3 && color3.length) {
                return scroolly.getTransitionColorValue(value, currentStop, progress);
            }

            return value;
        });
    };

    /**
     * Function that is called while sccrolls.
     * @param {boolean} force description
     * @returns {boolean}
     */
    scroolly.onScroll = function(force) {
        //        var scrollPos = $(document).scrollTop(); // Y-coord that is checked against fromY & toY
        var scrollPos = scroolly.body.scrollTop(); // Y-coord that is checked against fromY & toY

        if (!force && scrollPos === scroolly.scrollTop) {
            return false;
        }

        var prevPos = scroolly.scrollTop,
                prevDirection = scroolly.direction;

        scroolly.scrollTop = scrollPos; // Y-coord that is checked against fromY & toY
        scroolly.scrollBottom = scrollPos + scroolly.winHeight;
        scroolly.scrollCenter = scrollPos + Math.floor(scroolly.winHeight / 2);
        scroolly.direction = scrollPos - prevPos;

        var directionChanged = !(scroolly.direction === prevDirection || scroolly.direction < 0 && prevDirection < 0 || scroolly.direction > 0 && prevDirection > 0),
                item,
                totalRules,
                checkedIn,
                checkedOut,
                active,
                id, i, l, j,
                rule,
                fromX,
                toX,
                container,
                $bottomContainer,
                mode,
                itemHeight;

        for (id in scroolly.scrollLayout) {
            // cycling through all visual elements that should react
            // to scrolling and resizing
            item = scroolly.scrollLayout[id];
            totalRules = item.rules.length;
            checkedIn = [];
            checkedOut = [];
            active = [];

            for (i = 0; i < totalRules; i++) {
                rule = item.rules[i];
                fromX = scroolly._default(rule, 'minWidth', 0);
                toX = scroolly._default(rule, 'maxWidth', 'infinity');

                container = item.container === 'self' ? item.element : item.container;

                rule.checkin = scroolly.isRuleActive(rule, item.element, container);
                rule['class'] = rule['class'] || 'scroll-pos-' + (rule.alias) + ' window-width-' + fromX + '-to-' + toX;
                if (rule.checkin) {
                    active.push(i);
                    if (!rule.isActive) {
                        rule.isActive = true;
                        checkedIn.push(i);
                    }
                } else if (rule.isActive) {
                    rule.isActive = false;
                    checkedOut.push(i);
                }
                item.rules[i] = rule;
            }

            for (j = 0; j < checkedOut.length; j++) {
                i = checkedOut[j];
                rule = item.rules[i];
                item.element.removeClass(rule['class']);
                if (rule.cssOnScroll) {
                    l = rule.length || 0;
                    rule.cssOnScroll(item.element, scrollPos > prevPos ? l : 0, l, rule);
                }
                if (rule.onScroll) {
                    l = rule.length || 0;
                    rule.onScroll(item.element, scrollPos > prevPos ? l : 0, l, rule);
                }
                if (rule.onCheckOut) {
                    rule.onCheckOut(item.element, rule);
                }
                if (rule.onTopOut && scrollPos < prevPos) {
                    rule.onTopOut(item.element, rule);
                } else if (rule.onBottomOut && scrollPos > prevPos) {
                    rule.onBottomOut(item.element, rule);
                }
            }

            for (j = 0; j < checkedIn.length; j++) {
                i = checkedIn[j];
                rule = item.rules[i];

                if (rule.css) {
                    item.element.css(scroolly.extendCssWithPrefix(rule.css));
                }

                if (rule.addClass) {
                    item.element.addClass(rule.addClass);
                }

                if (rule.removeClass) {
                    item.element.removeClass(rule.removeClass);
                }
                item.element.addClass(rule['class']);

                $bottomContainer = scroolly._default(rule, 'bottomContainer');
                mode = scroolly._default(rule, 'mode');
                itemHeight = scroolly._default(rule, 'itemHeight');

                if ($bottomContainer && mode && itemHeight) {
                    $bottomContainer.css(mode + '-top', itemHeight + 'px');
                }

                if (rule.onCheckIn) {
                    rule.onCheckIn(item.element, rule);
                }

                if (rule.onTopIn && scrollPos > prevPos) {
                    rule.onTopIn(item.element, rule);
                } else if (rule.onBottomIn && scrollPos < prevPos) {
                    rule.onBottomIn(item.element, rule);
                }

                rule.length = rule.checkin.length;
            }

            for (j = 0; j < active.length; j++) {
                i = active[j];
                rule = item.rules[i];

                if (rule.cssOnScroll) {
                    rule.cssOnScroll(item.element, rule.checkin.offset, rule.checkin.length, rule);
                }

                if (rule.onScroll) {
                    rule.onScroll(item.element, rule.checkin.offset, rule.checkin.length, rule);
                }

                if (directionChanged && rule.onDirectionChanged) {
                    rule.onDirectionChanged(item.element, scroolly.direction, rule);
                }
            }
            scroolly.scrollLayout[id] = item;
        }

    };

    //Will be called once (when scroolly gets initialized).
    scroolly.detectCSSPrefix = function() {
        //Only relevant prefixes. May be extended.
        //Could be dangerous if there will ever be a CSS property which actually starts with "ms". Don't hope so.
        var rxPrefixes = /^(?:O|Moz|webkit|ms)|(?:-(?:o|moz|webkit|ms)-)/;

        //Detect prefix for current browser by finding the first property using a prefix.
        if (!window.getComputedStyle) {
            return;
        }

        var style = window.getComputedStyle(document.body, null);

        for (var k in style) {
            //We check the key and if the key is a number, we check the value as well, because safari's getComputedStyle returns some weird array-like thingy.
            scroolly.theCSSPrefix = (k.match(rxPrefixes) || (+k === k && style[k].match(rxPrefixes)));

            if (scroolly.theCSSPrefix) {
                break;
            }
        }

        //Did we even detect a prefix?
        if (!scroolly.theCSSPrefix) {
            scroolly.theCSSPrefix = scroolly.theDashedCSSPrefix = '';

            return;
        }

        scroolly.theCSSPrefix = scroolly.theCSSPrefix[0];

        //We could have detected either a dashed prefix or this camelCaseish-inconsistent stuff.
        if (scroolly.theCSSPrefix.slice(0, 1) === '-') {
            scroolly.theDashedCSSPrefix = scroolly.theCSSPrefix;

            //There's no logic behind these. Need a look up.
            scroolly.theCSSPrefix = ({
                '-webkit-': 'webkit',
                '-moz-': 'Moz',
                '-ms-': 'ms',
                '-o-': 'O'
            })[scroolly.theCSSPrefix];
        } else {
            scroolly.theDashedCSSPrefix = '-' + scroolly.theCSSPrefix.toLowerCase() + '-';
        }
    };

    scroolly.cssPrefix = function(key) {
        return scroolly.theDashedCSSPrefix + key;
    };

    scroolly.extendCssWithPrefix = function(cssObj) {
        var cssExt = {}, prop, re, m, newProp, val;

        for (prop in cssObj) {
            re = /^-(moz-|webkit-|o-|ms-)?/i;
            m = prop.match(re);
            newProp = prop.slice(1);
            //            console.dir({m: m});
            if (m && !m[1]) {
                val = cssObj[prop];
                cssExt[newProp] = val;
                cssExt[scroolly.cssPrefix(newProp)] = val;
                delete cssObj[prop];
            }
        }

        $.extend(cssObj, cssExt);

        return cssObj;
    };

    scroolly.now = Date.now || function() {
        return +new Date();
    };

    scroolly.getRAF = function() {
        var requestAnimFrame = window.requestAnimationFrame || window[scroolly.theCSSPrefix.toLowerCase() + 'RequestAnimationFrame'],
                lastTime = scroolly.now();

        if (false && scroolly.isMobile || !requestAnimFrame) {
            requestAnimFrame = function(callback) {
                //How long did it take to render?
                var deltaTime = scroolly.now() - lastTime,
                        delay = Math.max(0, 1000 / 60 - deltaTime);

                return window.setTimeout(function() {
                    lastTime = scroolly.now();
                    //        scroolly.timesCalled++;
                    //        scroolly.x.text(scroolly.timesCalled);
                    callback();
                }, delay);
            };
        }

        return requestAnimFrame;
    };

    scroolly.getCAF = function() {
        var cancelAnimFrame = window.cancelAnimationFrame || window[scroolly.theCSSPrefix.toLowerCase() + 'CancelAnimationFrame'];

        if (scroolly.isMobile || !cancelAnimFrame) {
            cancelAnimFrame = function(timeout) {
                return window.clearTimeout(timeout);
            };
        }

        return cancelAnimFrame;

    };

    scroolly.animLoop = function() {
        scroolly.onScroll();
        scroolly.animFrame = window.requestAnimFrame(scroolly.animLoop);
    };

    scroolly.init = function(options) {
        if (scroolly.isInitialized) {
            return false;
        }
        $.extend(scroolly.options, options);
        scroolly.isMobile = scroolly._default(scroolly.options, 'isMobile', (/Android|iPhone|iPad|iPod|BlackBerry/i).test(navigator.userAgent || navigator.vendor || window.opera));
        scroolly.detectCSSPrefix();
        scroolly.body = $(scroolly.options.body);
        window.requestAnimFrame = scroolly.getRAF();
        window.cancelAnimFrame = scroolly.getCAF();

        scroolly.timesCalled = 0;
        $(document).ready(function() {
            $(window).resize(scroolly.onResize).resize();
            //            scroolly.body.scroll(function(){scroolly.onScroll(true);}).scroll();
            scroolly.animLoop();
        });
        scroolly.isInitialized = true;
    };

    scroolly.destroy = function() {
        window.cancelAnimFrame(scroolly.animFrame);
    };

    scroolly.factorySticky = function($element, params, id) {
        id = id || $element[0].tagName + '_' + scroolly.getScrollLayoutLength();
        return scroolly.stickItemXY(id, $element, (params instanceof Array) ? params : [params]) ? id : false;
    };

    if (patchJQuery) {
        $.scroolly = scroolly;

        $.fn.scroolly = function(rules, $container, id) {
            scroolly.factory(this, rules, $container, id);
            return this;
        };

        /**
         * params = [widthRange1, widthRange2, ... , widthRangeN]
         *
         * widthRangeN = {
         *      $bottomContainer: $(DOMnode),   // - container that defines bottom container
         *      mode: 'margin'||'padding', // - defines the way element height will be compensated
         *      minWidth: 0,
         *      maxWidth: 'infinity',
         *      static: false // - whether element should be fixed allways for current width range
         * }
         *
         *
         * @param {type} params
         * @param {type} id
         * @returns {Boolean|String}
         */
        $.fn.scroollySticky = function(params, id) {
            scroolly.init();

            if (!this.length) {
                return false;
            }

            return scroolly.factorySticky(this, params, id);
        };
    }

    return scroolly;
}));


