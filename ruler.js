window.htmlRuler = /*  */ !(function () {
  /**
   * Unifies event handling across browsers
   *
   * - Allows registering and unregistering of event handlers
   * - Injects event object and involved DOM element to listener
   *
   * @author Mark Rolich <mark.rolich@gmail.com>
   */
  var Event = function () {
    'use strict';
    this.attach = function (evtName, element, listener, capture) {
      var evt = '';
      var useCapture = (capture === undefined) ? true : capture;
      var handler = null;

      if (window.addEventListener === undefined) {
        evt = 'on' + evtName;
        handler = function (evtA, listenerA) {
          element.attachEvent(evtA, listenerA);
          return listenerA;
        };
      } else {
        evt = evtName;
        handler = function (evtA, listenerA, useCaptureA) {
          element.addEventListener(evtA, listenerA, useCaptureA);
          return listenerA;
        };
      }

      return handler.apply(element, [evt, function (ev) {
        var e = ev || event;
        var src = e.srcElement || e.target;
        if (e.targetTouches && e.targetTouches[0]) {
          e = e.targetTouches[0];
        }
        listener(e, src);
      }, useCapture]);
    };

    this.detach = function (evtName, element, listener, capture) {
      var evt = '';
      var useCapture = (capture === undefined) ? true : capture;

      if (window.removeEventListener === undefined) {
        evt = 'on' + evtName;
        element.detachEvent(evt, listener);
      } else {
        evt = evtName;
        element.removeEventListener(evt, listener, useCapture);
      }
    };

    this.stop = function (evt) {
      evt.cancelBubble = true;

      if (evt.stopPropagation) {
        evt.stopPropagation();
      }
    };

    this.prevent = function (evt) {
      if (evt.preventDefault) {
        evt.preventDefault();
      } else {
        evt.returnValue = false;
      }
    };
  };

  /**
   * This Javascript package implements drag-n-drop functionality in a browser.
   *
   * Supports:
   * - Moving an element horizontally, vertically and in both directions
   * - Snap to grid functionality
   * - Limitation of moving distance
   * - Registering of user-defined function on start, move and stop
   *
   * Tested in the following browsers: IE 6.0, FF 17, Chrome 22, Safari 5.1.1
   *
   * Dragdrop.js requires Event.js package, which can be acquired at the following links:
   * Github - https://github.com/mark-rolich/Event.js
   * JS Classes - http://www.jsclasses.org/package/212-JavaScript-Handle-events-in-a-browser-independent-manner.html
   *
   * @author Mark Rolich <mark.rolich@gmail.com>
   */
  var Dragdrop = function (evt) {
    'use strict';
    var elem = null;
    var started = 0;
    var self = this;
    var moveHandler = null;
    var doc = document.documentElement;
    var body = document.body;
    var gWidth = (body.scrollWidth > doc.clientWidth) ? body.scrollWidth : doc.clientWidth;
    var gHeight = Math.max(body.scrollHeight, body.offsetHeight,
      doc.clientHeight, doc.scrollHeight, doc.offsetHeight);
    var move = function (e) {
      var xDiff = e.clientX - elem.posX;
      var yDiff = e.clientY - elem.posY;
      var x = xDiff - (xDiff % elem.snap) + 'px';
      var y = yDiff - (yDiff % elem.snap) + 'px';

      if (started === 1) {
        if (!elem.mode) {
          if (elem.className === 'guide v draggable') {
            elem.mode = 1;
          } else if (elem.className === 'guide h draggable') {
            elem.mode = 2;
          }
        }
        switch (elem.mode) {
          case 0:
            elem.style.top = y;
            elem.style.left = x;
            break;
          case 1:
            elem.style.left = x;
            break;
          case 2:
            elem.style.top = y;
            break;
          default:
            break;
        }

        if (elem.mode !== 2) {
          if (xDiff <= elem.minX) {
            elem.style.left = elem.minX + 'px';
          }

          if (elem.offsetLeft + elem.offsetWidth >= elem.maxX) {
            elem.style.left = (elem.maxX - elem.offsetWidth) + 'px';
          }
        }

        if (elem.mode !== 1) {
          if (yDiff <= elem.minY) {
            elem.style.top = elem.minY + 'px';
          }

          if (elem.offsetTop + elem.offsetHeight >= elem.maxY) {
            elem.style.top = (elem.maxY - elem.offsetHeight) + 'px';
          }
        }

        elem.onMove(elem);
      }
    };
    var start = function (e, src) {
      if (src.className.indexOf('draggable') !== -1) {
        evt.prevent(e);

        moveHandler = evt.attach(TAP_EVT.MOVE, document, move, true);
        started = 1;

        elem = src;
        elem.posX = e.clientX - elem.offsetLeft;
        elem.posY = e.clientY - elem.offsetTop;

        if (elem.mode === undefined) {
          self.set(elem);
        }

        elem.onStart(elem);

        if (elem.setCapture) {
          elem.setCapture();
        }
      }
    };
    var stop = function () {
      if (started === 1) {
        started = 0;
        elem.onStop(elem);
        evt.detach(TAP_EVT.MOVE, document, moveHandler);

        if (elem.releaseCapture) {
          elem.releaseCapture();
        }
      }
    };

    evt.attach(TAP_EVT.PUSH, document, start, false);
    evt.attach(TAP_EVT.RELEASE, document, stop, false);

    this.start = start;

    this.set = function (element, elemOptions) {
      var options = elemOptions || {};

      elem = (typeof element === 'string')
        ? document.getElementById(element)
        : element;

      elem.mode = options.mode || 0;
      elem.minX = options.minX || 0;
      elem.maxX = options.maxX || gWidth;
      elem.minY = options.minY || 0;
      elem.maxY = options.maxY || gHeight;
      elem.snap = options.snap || 1;
      elem.onStart = options.onstart || function () { };
      elem.onMove = options.onmove || function () { };
      elem.onStop = options.onstop || function () { };

      elem.style.left = elem.offsetLeft + 'px';
      elem.style.top = elem.offsetTop + 'px';

      elem.unselectable = 'on';
    };
  };

  /**
   * This Javascript package creates Photoshop-like guides and rulers interface on a web page.
   * Guides are created by click-and-dragging corresponding horizontal or vertical ruler.
   * Guide positions could be saved in a local storage and opened later (on a page location basis)
   * It is possible to open/save created guides as grids
   * (Note: grids will be saved on a page location basis,
   * so it's not possible to use the same grids in another browser window/tab).
   * Rulers can be unlocked, so that one of the rulers will scroll along
   * the page and the other will be always visible.
   * Guides can be snapped to defined number of pixels.
   * Detailed info mode is available, which shows position
   * and size of regions created by the guides.
   * Guides can be snapped to DOM elements (experimental)
   *
   * Following hotkeys are available:
   *
   * Toggle rulers - Ctrl+Alt+R
   * Toggle guides - Ctrl+Alt+G
   * Toggle rulers and guides - Ctrl+Alt+A
   * Clear all guides - Ctrl+Alt+D
   * Save grid dialog - Ctrl+Alt+S
   * Open grid dialog - Ctrl+Alt+P
   * Open Config dialog - Ctrl+Alt+L
   * Open Snap dialog - Ctrl+Alt+C
   * Toggle detail info - Ctrl+Alt+I
   * Snap to DOM elements - Ctrl+Alt+E
   *
   * Look-and-feel can be adjusted using CSS.
   *
   * RulersGuides.js is available as a bookmarklet, please see bookmarklet.js file
   * provided with the package
   *
   * RulersGuides.js requires Event.js and Dragdrop.js packages,
   * which can be acquired at the following links:
   *
   * Event.js
   *
   * Github - https://github.com/mark-rolich/Event.js
   * JS Classes - http://www.jsclasses.org/package/212-JavaScript-Handle-events-in-a-browser-independent-manner.html
   *
   * Dragdrop.js
   *
   * Github - https://github.com/mark-rolich/Dragdrop.js
   * JS Classes - http://www.jsclasses.org/package/215-JavaScript-Handle-drag-and-drop-events-of-page-elements.html
   *
   * @author Mark Rolich <mark.rolich@gmail.com>
   */
  var RulersGuides = function (evt, dragdrop) {
    'use strict';

    var rgContainer = create('div', null, { id: RULERS_GUIDES_ID });
    var rgBackground = create('div', null, { class: 'rg-background' });

    rgContainer.appendChild(rgBackground);
    document.body.appendChild(rgContainer);

    var html = document.documentElement;
    var doc = document.documentElement;
    var body = document.body;
    var vw = html.clientWidth;
    var vh = html.clientHeight;
    var wrapper = null;
    var hRuler = null;
    var vRuler = null;
    var menu = null;
    var dialogs = [];
    var snapDialog = null;
    var openGridDialog = null;
    var xSnap = 0;
    var ySnap = 0;
    var mode = 2;
    var guides = {};
    var guidesCnt = 0;
    var gUid = '';
    var rulerStatus = 1;
    var guideStatus = 1;
    var hBound = 0;
    var vBound = 0;
    var gridList = null;
    var gridListLen = 0;
    var menuBtn = null;
    var gInfoBlockWrapper = null;
    var detailsStatus = 0;
    var domElements = [];
    var domDimensions = [];
    var resizeTimer = null;
    var snapDom = 0;
    var cssText = '';
    var Ruler = function (type, size) {
      var ruler = create('div', null, { class: 'ruler ' + type + ' unselectable' });
      var i = 0;
      var span = null;
      var label = null;
      var spanFrag = document.createDocumentFragment();
      var cnt = Math.floor(size / 2);


      for (i; i < cnt; i += 1) {
        span = create('span');

        if (i % 25 === 0) {
          if (i > 0) {
            label = create('span');
            label.className = 'label';

            if (i < 50) {
              label.className += ' l10';
            } else if (i >= 50 && i < 500) {
              label.className += ' l100';
            } else if (i >= 500) {
              label.className += ' l1000';
            }

            label.innerHTML = i * 2;
            span.appendChild(label);
          }

          span.className = 'milestone';
        } else if (i % 5 === 0) {
          span.className = 'major';
        } else {
          span.className = '';
          span.removeAttribute('class');
        }

        spanFrag.appendChild(span);
      }

      ruler.appendChild(spanFrag);

      return ruler;
    };
    var getWindowSize = function () {
      var w = Math.max(
        body.scrollWidth,
        body.offsetWidth,
        doc.clientWidth,
        doc.scrollWidth,
        doc.offsetWidth
      );
      var h = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        doc.clientHeight,
        doc.scrollHeight,
        doc.offsetHeight
      );

      return [w, h];
    };
    var getScrollPos = function () {
      var t = Math.max(doc.scrollTop, body.scrollTop);
      var l = Math.max(doc.scrollLeft, body.scrollLeft);

      return [t, l];
    };
    var closeAllDialogs = function () {
      var i = 0;

      for (i; i < dialogs.length; i += 1) {
        dialogs[i].close();
      }
    };
    var removeInboundGuide = function (guide, gUidA) {
      var scrollPos = getScrollPos();

      if (
        rulerStatus === 1 && guideStatus === 1 && (
          (guide.className === 'guide h draggable' && guide.offsetTop < hBound + scrollPos[0]) ||
                    (guide.className === 'guide v draggable' && guide.offsetLeft < vBound + scrollPos[1])
        )
      ) {
        guide.remove();
        delete guides[gUidA];
        guidesCnt -= 1;
      }
    };
    var removeInboundGuides = function () {
      for (var i in guides) {
        if (forloop(guides, i)) {
          removeInboundGuide(guides[i], i);
        }
      }
    };
    var toggleGuides = function () {
      guideStatus = 1 - guideStatus;
      rulerStatus || guideStatus ? MaskHelper.openMask() : MaskHelper.closeMask();

      for (var i in guides) {
        if (forloop(guides, i)) {
          guides[i].style.display = (guideStatus === 1) ? 'block' : 'none';
        }
      }

      if (guideStatus === 1) {
        wrapper.style.display = 'block';
      }
    };
    var toggleRulers = function () {
      rulerStatus = 1 - rulerStatus;
      rulerStatus || guideStatus ? MaskHelper.openMask() : MaskHelper.closeMask();

      if (rulerStatus === 1) {
        vRuler.style.display = 'block';
        hRuler.style.display = 'block';
        wrapper.style.display = 'block';
        removeInboundGuides();
        MaskHelper.openMask();
      } else {
        vRuler.style.display = 'none';
        hRuler.style.display = 'none';
      }
    };
    var removeGrid = function (gridName) {
      if (gridList[gridName] !== undefined) {
        delete gridList[gridName];
        window.localStorage.setItem('RulersGuides', JSON.stringify(gridList));
        gridListLen -= 1;
      }
    };
    var deleteGuides = function () {
      if (guidesCnt > 0) {
        for (var i in guides) {
          if (forloop(guides, i)) {
            guides[i].remove();
            delete guides[i];
            guidesCnt -= 1;
          }
        }

        gInfoBlockWrapper.style.display = 'none';
      }
    };
    var renderGrid = function (gridName) {
      if (gridList[gridName] !== undefined) {
        var grid = gridList[gridName];

        deleteGuides();

        for (var guideId in grid) {
          if (forloop(grid, guideId)) {
            var guideElem = create('div');
            guideElem.id = guideId;
            guideElem.className = grid[guideId].cssClass;
            guideElem.style.cssText = grid[guideId].style;

            wrapper.appendChild(guideElem);
            guides[guideId] = guideElem;
            guidesCnt += 1;

            var text;
            var offset;
            if (guideElem.className === 'guide v draggable') {
              offset = parseInt(guideElem.style.left, 10);
              if (offset && offset > 0 && offset < vw) {
                text = offset + 'px';
              }
            } else if (guideElem.className === 'guide h draggable') {
              offset = parseInt(guideElem.style.top, 10);
              if (offset && offset > 0 && offset < vh) {
                text = offset + 'px';
              }
            }
            if (!text) {
              guideElem.remove();
              continue;
            }
            guideElem.info = create('div', text, { class: 'info' });
            guideElem.appendChild(guideElem.info);
            guideElem.over = guideElem.over || evt.attach(TAP_EVT.OVER, guideElem,
              function (e, src) {
                if (src.className === 'guide v draggable') {
                  src.style.top = 0;
                  src.info.style.top = (e.clientY + getScrollPos()[0] - 35) + 'px';
                } else if (src.className === 'guide h draggable') {
                  src.style.left = 0;
                  src.info.style.left = (e.clientX + getScrollPos()[1] + 10) + 'px';
                }
              });
          }
        }
      }
    };
    var OpenGridDialog = function () {
      var dialog = null;
      var self = this;
      var select = null;
      var renderSelect = function (insertOrUpdate) {
        var gridName;
        var options = '';
        var i;

        gridListLen = 0;

        if (window.localStorage) {
          gridList = JSON.parse(window.localStorage.getItem('RulersGuides'));

          for (i in gridList) {
            if (forloop(gridList, i)) {
              gridListLen += 1;
            }
          }
        }

        if (insertOrUpdate === 0) {
          select = create('select');
          select.id = 'grid-list';
        }

        if (gridListLen > 0) {
          for (gridName in gridList) {
            if (forloop(gridList, gridName)) {
              options += '<option>' + gridName + '</option>';
            }
          }

          select.innerHTML = options;
        }

        return select;
      };

      this.render = function () {
        if (dialog === null) {
          dialog = create('div');
          select = renderSelect(0);

          var text = document.createTextNode('');
          var titleBar = create('div');
          var dialogWrapper = create('div');
          var okBtn = create('button');
          var cancelBtn = create('button');
          var delBtn = create('button');
          var titleBarTxt = text.cloneNode(false);
          var okBtnTxt = text.cloneNode(false);
          var cancelBtnTxt = text.cloneNode(false);
          var delBtnTxt = text.cloneNode(false);

          titleBarTxt.nodeValue = 'Open grid';
          okBtnTxt.nodeValue = 'OK';
          cancelBtnTxt.nodeValue = 'Cancel';
          delBtnTxt.nodeValue = 'Delete';

          dialog.className = 'dialog open-dialog';
          titleBar.className = 'title-bar';
          dialogWrapper.className = 'wrapper';

          okBtn.className = 'ok-btn';
          cancelBtn.className = 'cancel-btn';
          delBtn.className = 'del-btn';

          titleBar.appendChild(titleBarTxt);
          okBtn.appendChild(okBtnTxt);
          cancelBtn.appendChild(cancelBtnTxt);
          delBtn.appendChild(delBtnTxt);

          dialogWrapper.appendChild(select);
          dialogWrapper.appendChild(delBtn);
          dialogWrapper.appendChild(okBtn);
          dialogWrapper.appendChild(cancelBtn);

          dialog.appendChild(titleBar);
          dialog.appendChild(dialogWrapper);

          rgContainer.appendChild(dialog);

          evt.attach('click', delBtn, function () {
            if (select.options.length > 0) {
              removeGrid(select.options[select.selectedIndex].value);

              select.removeChild(
                select.options[select.selectedIndex]
              );
            }

            if (select.options.length === 0) {
              self.close();
            }
          });

          evt.attach('click', okBtn, function () {
            renderGrid(select.value);
            self.close();
          });

          evt.attach('click', cancelBtn, function () {
            self.close();
          });
        }
      };

      this.render();

      this.open = function () {
        closeAllDialogs();

        renderSelect(1);

        if (gridListLen > 0) {
          dialog.style.display = 'block';
          dialog.style.left = ((doc.clientWidth - dialog.clientWidth) / 2) + 'px';
          dialog.style.top = ((doc.clientHeight - dialog.clientHeight) / 2) + 'px';
        }
      };

      this.close = function () {
        dialog.style.display = 'none';
      };
    };
    var configDialog = (function () {
      var div = create('div');
      var dialog = div.cloneNode(false);
      var titleBar = div.cloneNode(false);
      var dialogWrapper = div.cloneNode(false);

      dialog.className = 'dialog config-dialog';
      titleBar.className = 'title-bar';
      dialogWrapper.className = 'wrapper';
      titleBar.innerHTML = 'Config Dialog: Custom Config Switch';

      dialog.appendChild(titleBar);
      dialog.appendChild(dialogWrapper);
      setTimeout(function () { rgContainer.appendChild(dialog); }, 100);
      function handlerOpen() {
        closeAllDialogs();
        updateGrids();
        updateStyle();
        updateTable();
        updateSelect();
        dialog.style.display = 'block';
      }
      function handlerClose() {
        dialog.style.display = 'none';
      }

      var end = create('button', 'Close');
      end.onclick = handlerClose;
      var refresh = create('button', 'Refresh');
      refresh.onclick = function () {
        updateGrids();
        updateStyle();
        updateTable();
        updateSelect();
      };
      var center = create('div', '<b>Get Grids Intersection Elements, and Transfer Elements TOP/RIGHT/BOTTOM/LEFT Boundary into grids</b><br/>1. save old grids<br/>2. hide ruler/grid/dialog<br/>3. get grids intersection<br/>4. get elements and boundary<br/><b>Below is current grids:</b>');
      var gridDiv = create('div');
      var cgeBtn = create('button', 'Cross Grids Elements');
      center.appendChild(gridDiv);
      var gridData = { v: [], h: [] };
      function updateGrids() {
        if (!guides) {
          gridDiv.innerHTML = 'no guide grids';
          return;
        }
        gridData = { v: [], h: [] };
        for (var key in guides) {
          if (forloop(guides, key) && guides[key]) {
            var grid = guides[key];
            if (grid.className === 'guide h draggable') {
              var top = parseInt(getStyle(grid).top, 10);
              top && gridData.h.push(top);
            } else if (grid.className === 'guide v draggable') {
              var left = parseInt(getStyle(grid).left, 10);
              left && gridData.v.push(left);
            }
          }
        }
        gridData.v.sort(function (a, b) { return a - b; });
        gridData.h.sort(function (a, b) { return a - b; });
        gridDiv.innerHTML = 'left: ' + gridData.v.join() + '<br/>top: ' + gridData.h.join();
      }
      cgeBtn.onclick = function () {
        if (gridData.v.length && gridData.h.length) {
          guideStatus = 1;
          rulerStatus = 1;
          toggleGuides();
          toggleRulers();
          closeAllDialogs();
          wrapper.style.display = 'none';
          var points = {};
          for (var i = 0; i < gridData.v.length; i++) {
            for (var j = 0; j < gridData.h.length; j++) {
              var x = gridData.v[i];
              var y = gridData.h[j];
              points[x + '|' + y] = [x, y];
            }
          }
          var tops = {};
          var lefts = {};
          for (var keyX in points) {
            if (forloop(points, keyX)) {
              var xO = parseInt(points[keyX][0], 10);
              var yO = parseInt(points[keyX][1], 10);
              if (!xO || !yO) {
                continue;
              }
              var eleX = document.elementFromPoint(xO, yO);
              var rect = eleX.getBoundingClientRect();
              rect.top > 0 && rect.top < vh && (tops[rect.top] = 1);
              rect.bottom > 0 && rect.bottom < vh && (tops[rect.bottom] = 1);
              rect.left > 0 && rect.left < vw && (lefts[rect.left] = 1);
              rect.right > 0 && rect.right < vw && (lefts[rect.right] = 1);
            }
          }
          deleteGuides();
          for (var keyT in tops) {
            if (forloop(tops, keyT)) {
              gridData.h = [];
              gridData.h.push(keyT);
              var idT = 'guide-h' + keyT;
              var eleH = create('div', null, { id: idT, class: 'guide h draggable' });
              eleH.style.top = keyT + 'px';
              eleH.style.left = 0;
              wrapper.appendChild(eleH);
              guides[idT] = eleH;
              guidesCnt += 1;

              eleH.info = create('div', keyT, { class: 'info' });
              eleH.appendChild(eleH.info);
              eleH.over = eleH.over || evt.attach(TAP_EVT.OVER, eleH, function (e, src) {
                if (src.className === 'guide v draggable') {
                  src.info.style.top = ((e.clientY + getScrollPos()[0]) - 35) + 'px';
                } else if (src.className === 'guide h draggable') {
                  src.info.style.left = (e.clientX + getScrollPos()[1] + 10) + 'px';
                }
              });
            }
          }
          for (var key in lefts) {
            if (forloop(lefts, key)) {
              gridData.v = [];
              gridData.v.push(key);
              var id = 'guide-h' + key;
              var ele = create('div', null, { id: id, class: 'guide v draggable' });
              ele.style.top = key + 'px';
              ele.style.left = 0;
              wrapper.appendChild(ele);
              guides[id] = ele;
              guidesCnt += 1;

              ele.info = create('div', key, { class: 'info' });
              ele.appendChild(ele.info);
              ele.over = ele.over || evt.attach(TAP_EVT.OVER, ele, function (e, src) {
                if (src.className === 'guide v draggable') {
                  src.info.style.top = (e.clientY + getScrollPos()[0] - 35) + 'px';
                } else if (src.className === 'guide h draggable') {
                  src.info.style.left = (e.clientX + getScrollPos()[1] + 10) + 'px';
                }
              });
            }
          }
          guideStatus = 0;
          rulerStatus = 1;
          toggleGuides();
          toggleRulers();
        }
      };
      var add = create('button', 'Add Style');
      add.onclick = function () {
        if (!currentProp || !(currentProp in currentStyle)) { return; }
        var prop = currentProp.replace(/-[a-z]/g, function (m) {
          return m.slice(1).toUpperCase();
        });
        customProps[prop] = true;
        rgBackground.style[prop] = currentValue;
        updateStyle();
        updateTable();
      };
      var haha = create('button', 'HaHa Smile :)');
      haha.onclick = function () {
        rulerStatus = 0;
        guideStatus = 0;
        toggleRulers();
        toggleGuides();
        wrapper.style.display = 'block';
        rgBackground.style.display = 'block';
        handlerClose();
      };
      var customProps = {};
      var currentProp = '';
      var currentValue = '';
      var currentStyle = {};
      var title = create('div', 'Background Image Style Config: ');
      var table = create('table');
      var select = create('select', null, { class: 'ipt' });
      var csslabel = create('label', 'style: ');
      var input = create('input', null, { class: 'ipt' });
      csslabel.appendChild(input);
      table.onclick = function (e) {
        e = e || window.event;
        var src = e.target || e.srcElement;
        var tag = src.nodeName.toLowerCase();
        if (tag === 'button') {
          var prop = src.getAttribute('data-prop');
          delete customProps[prop];
          rgBackground.style[prop] = '';
          updateStyle();
          updateSelect();
          updateTable();
        } else if (tag === 'td' && src.getAttribute('data-type') === 'prop') {
          select.value = src.innerHTML;
          select.onchange();
        }
        return false;
      };
      select.onchange = function () {
        currentProp = select.value || '';
        var prop = currentProp.replace(/-[a-z]/g, function (m) {
          return m.slice(1).toUpperCase();
        });
        currentValue = currentStyle[prop] || '';
        input.value = currentValue;
      };
      input.onchange = function () {
        currentValue = input.value;
      };
      var selectlabel = create('label');
      selectlabel.appendChild(select);
      selectlabel.appendChild(add);

      var bgVisible = create('label', 'bgVisible<b>(toggle background visible)</b>: ');
      var bgVisibleInput = create('input', null, { type: 'checkbox' });
      bgVisible.appendChild(bgVisibleInput);
      bgVisibleInput.onchange = function () {
        var value = bgVisibleInput.checked ? 'block' : 'none';
        rgBackground.style.display = value;
        updateStyle();
        updateTable();
      };

      var bgOpacity = create('label', 'bgOpacity: ');
      var bgOpacityInput = create('input', null, { type: 'number', class: 'ipt' });
      bgOpacity.appendChild(bgOpacityInput);
      bgOpacityInput.onchange = function () {
        rgBackground.style.opacity = bgOpacityInput.value;
        updateStyle();
        updateTable();
      };

      var bgImage = create('label', 'bgImage: ');
      var bgImageInput = create('input', null, { class: 'ipt' });
      bgImage.appendChild(bgImageInput);
      bgImageInput.onchange = function () {
        rgBackground.style.backgroundImage = 'url(' + bgImageInput.value + ')';
        updateStyle();
        updateTable();
      };

      var ruleVisible = create('label', 'ruleVisible<b>(need menu [show rulers])</b>: ');
      var ruleVisibleInput = create('input', null, { type: 'checkbox' });
      ruleVisible.appendChild(ruleVisibleInput);
      ruleVisibleInput.onchange = function () {
        var value = ruleVisibleInput.checked ? 'block' : 'none';
        document.querySelector('.ruler.h').style.display = value;
        document.querySelector('.ruler.v').style.display = value;
      };
      var ruleOpacity = create('label', 'ruleOpacity: ');
      var ruleOpacityInput = create('input', null, { type: 'number', class: 'ipt' });
      ruleOpacity.appendChild(ruleOpacityInput);
      ruleOpacityInput.onchange = function () {
        document.querySelector('.ruler.h').style.opacity = ruleOpacityInput.value;
        document.querySelector('.ruler.v').style.opacity = ruleOpacityInput.value;
      };
      var scrollLock = create('label', 'scrollLock<b>(handle scroll or lock)</b>: ');
      var scrollLockInput = create('input', null, { type: 'checkbox' });
      scrollLock.appendChild(scrollLockInput);
      scrollLockInput.onchange = function () {
        scrollLockInput.checked ? MaskHelper.openMask() : MaskHelper.closeMask();
      };

      dialogWrapper.appendChild(title);
      dialogWrapper.appendChild(table);
      dialogWrapper.appendChild(selectlabel);
      dialogWrapper.appendChild(csslabel);
      dialogWrapper.appendChild(bgOpacity);
      dialogWrapper.appendChild(bgImage);
      dialogWrapper.appendChild(create('hr'));
      dialogWrapper.appendChild(ruleOpacity);
      dialogWrapper.appendChild(ruleVisible);
      dialogWrapper.appendChild(bgVisible);
      dialogWrapper.appendChild(scrollLock);
      dialogWrapper.appendChild(create('hr'));
      dialogWrapper.appendChild(center);
      dialogWrapper.appendChild(create('hr'));
      dialogWrapper.appendChild(end);
      dialogWrapper.appendChild(refresh);
      dialogWrapper.appendChild(cgeBtn);
      dialogWrapper.appendChild(haha);
      function updateStyle() {
        currentStyle = getStyle(rgBackground);
        ruleVisibleInput.checked = document.querySelector('.ruler').style.display === 'block';
        bgVisibleInput.checked = rgBackground.style.display === 'block';
        scrollLockInput.checked = MaskHelper.isLock();
      }
      function updateTable() {
        var innerTable = '<thead><tr><th>Prop</th><th>Value</th><th>Action</th></tr></thead>';
        innerTable += '<tbody>';
        for (var prop in customProps) {
          if (customProps[prop]) {
            var value = currentStyle[prop];
            innerTable += '<tr><th data-type=prop>' + prop + '</th><th>' + value + '</th><th><button data-prop=' + prop + '>Del</button></th></tr>';
          }
        }
        innerTable += '</tbody>';
        table.innerHTML = innerTable;
      }
      function updateSelect() {
        var text = '';
        for (var i = 0; i < currentStyle.length; i++) {
          var key = currentStyle[i];
          text += create('option', key).outerHTML;
        }
        select.innerHTML = text;
        if (!(currentValue in currentStyle)) {
          select.value = 'opacity';
          select.onchange();
        }
      }

      return { open: handlerOpen, close: handlerClose };
    })();
    var saveGrid = function (customName) {
      var data = {};
      var gridData = {};
      var i;
      var gridName = '';

      while (gridName === '' && guidesCnt > 0) {
        gridName = customName || window.prompt('Save grid as');

        if (gridName !== '' && gridName !== false && gridName !== null && window.localStorage) {
          for (i in guides) {
            if (forloop(guides, i)) {
              gridData[i] = {
                cssClass: guides[i].className,
                style: guides[i].style.cssText
              };
            }
          }

          if (window.localStorage.getItem('RulersGuides') !== null) {
            data = JSON.parse(window.localStorage.getItem('RulersGuides'));
          }

          data[gridName] = gridData;
          window.localStorage.setItem('RulersGuides', JSON.stringify(data));

          gridListLen += 1;
        }
      }
    };
    var showDetailedInfo = function () {
      var i;
      var j = 0;
      var hGuides = [];
      var vGuides = [];
      var infoBlockWrapper = create('div');
      var infoFrag = document.createDocumentFragment();
      var infoBlock = create('div');
      var infoBlockTxt = create('div');

      for (i in guides) {
        if (forloop(guides, i)) {
          if (guides[i].type === 'h') {
            hGuides.push(guides[i].y);
          } else {
            vGuides.push(guides[i].x);
          }
        }
      }

      vGuides.unshift(0);
      vGuides.push(doc.clientWidth);

      hGuides.unshift(0);
      hGuides.push(doc.clientHeight);

      vGuides = vGuides.sort(function (a, b) { return a - b; });

      hGuides = hGuides.sort(function (a, b) { return a - b; });

      for (i = 0; i < hGuides.length - 1; i += 1) {
        j = 0;

        for (j; j < vGuides.length - 1; j += 1) {
          infoBlock = create('div');
          infoBlockTxt = create('div');
          var innerHTML = '';

          infoBlockWrapper.className = 'info-block-wrapper';
          infoBlock.className = 'info-block';
          infoBlockTxt.className = 'info-block-txt';

          infoBlock.className += (
            (i % 2 !== 0 && j % 2 !== 0) ||
                        (i % 2 === 0 && j % 2 === 0)
          )
            ? ' even'
            : ' odd';

          infoBlock.style.top = hGuides[i] + 'px';
          infoBlock.style.left = vGuides[j] + 'px';
          infoBlock.style.width = (vGuides[j + 1] - vGuides[j]) + 'px';
          infoBlock.style.height = (hGuides[i + 1] - hGuides[i]) + 'px';

          innerHTML += 'w*h: ' + (vGuides[j + 1] - vGuides[j]) + '*' + (hGuides[i + 1] - hGuides[i]);
          innerHTML += '<br/>top: ' + hGuides[i];
          innerHTML += '<br/>right: ' + vGuides[j + 1];
          innerHTML += '<br/>bottom: ' + hGuides[i + 1];
          innerHTML += '<br/>left: ' + vGuides[j];

          infoBlockTxt.innerHTML = innerHTML;
          infoBlock.appendChild(infoBlockTxt);

          if (!i || !j) {
            infoBlock = null;
            continue;
          }
          infoBlockTxt.style.marginTop = (i === 0) ? document.querySelector('.ruler.h').clientHeight + 5 + 'px' : '0';
          infoBlockTxt.style.marginLeft = (j === 0) ? document.querySelector('.ruler.v').clientWidth + 5 + 'px' : '0';

          infoFrag.appendChild(infoBlock);
        }
      }

      infoBlockWrapper.appendChild(infoFrag);

      if (detailsStatus === 1) {
        wrapper.replaceChild(infoBlockWrapper, gInfoBlockWrapper);
        gInfoBlockWrapper = infoBlockWrapper;
      } else {
        gInfoBlockWrapper.style.display = 'none';
      }
    };
    var calculateDomDimensions = function () {
      var x = [];
      var y = [];
      var dm = [];
      var i = 0;
      var len = domElements.length;
      var findDimensions = function (elem) {
        var t = 0;
        var l = 0;
        var w = elem.offsetWidth;
        var h = elem.offsetHeight;

        while (elem) {
          l += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
          t += (elem.offsetTop - elem.scrollTop + elem.clientTop);
          elem = elem.offsetParent;
        }

        return [l, t, l + w, t + h];
      };
      var getUnique = function (arr) {
        var u = {};
        var a = [];
        var idx = 0;
        var arrLen = arr.length;

        for (idx; idx < arrLen; idx += 1) {
          if (forloop(u, arr[idx]) === false) {
            a.push(arr[idx]);
            u[arr[idx]] = 1;
          }
        }

        return a;
      };

      for (i; i < len; i += 1) {
        dm = findDimensions(domElements[i]);

        x.push(dm[0]);
        x.push(dm[2]);

        y.push(dm[1]);
        y.push(dm[3]);
      }

      x = getUnique(x).sort(function (a, b) { return a - b; });
      y = getUnique(y).sort(function (a, b) { return a - b; });

      return [x, y];
    };
    var Menu = function () {
      var menuList = null;
      var status = 0;
      var toggles = {};
      var menuItemsList = [{
        text: 'Hide all',
        hotkey: 'Ctrl + Alt + A',
        alias: 'all'
      }, {
        text: 'Hide rulers',
        hotkey: 'Ctrl + Alt + R',
        alias: 'rulers'
      }, {
        text: 'Hide guides',
        hotkey: 'Ctrl + Alt + G',
        alias: 'guides'
      }, {
        text: 'Clear all guides',
        hotkey: 'Ctrl + Alt + D',
        alias: 'clear'
      }, {
        text: 'Open grid',
        hotkey: 'Ctrl + Alt + O',
        alias: 'open'
      }, {
        text: 'Save grid',
        hotkey: 'Ctrl + Alt + S',
        alias: 'save'
      }, {
        text: 'Show detail info',
        hotkey: 'Ctrl + Alt + I',
        alias: 'details'
      }, {
        text: 'Snap to DOM',
        hotkey: 'Ctrl + Alt + E',
        alias: 'snapdom'
      }, {
        text: 'Snap dialog',
        hotkey: 'Ctrl + Alt + C',
        alias: 'snap'
      }, {
        text: 'Config dialog',
        hotkey: 'Ctrl + Alt + L',
        alias: 'config'
      }];
      var i = 0;

      this.render = function () {
        menuBtn = create('div');
        menuBtn.className = 'menu-btn unselectable';
        menuBtn.appendChild(document.createTextNode('\u250C'));

        menuList = create('ul');
        menuList.className = 'rg-menu';

        var menuItems = document.createDocumentFragment();
        var li = create('li');
        var liLink = create('a');
        var liDesc = create('span');
        var liHotKey = create('span');
        var liDescTxt = document.createTextNode('');
        var liHotKeyTxt = liDescTxt.cloneNode(false);

        liDesc.className = 'desc';
        liHotKey.className = 'hotkey';

        for (i; i < menuItemsList.length; i += 1) {
          li = create('li');
          liLink = liLink.cloneNode(false);
          liDesc = liDesc.cloneNode(false);
          liHotKey = liHotKey.cloneNode(false);
          liDescTxt = liDescTxt.cloneNode(false);
          liHotKeyTxt = liHotKeyTxt.cloneNode(false);

          liDescTxt.nodeValue = menuItemsList[i].text;
          liHotKeyTxt.nodeValue = menuItemsList[i].hotkey;

          liDesc.appendChild(liDescTxt);
          liHotKey.appendChild(liHotKeyTxt);

          liLink.appendChild(liDesc);
          liLink.appendChild(liHotKey);

          li.appendChild(liLink);

          menuItems.appendChild(li);

          toggles[menuItemsList[i].alias] = {
            obj: liLink,
            txt: liDescTxt
          };
        }

        evt.attach(TAP_EVT.PUSH, toggles.rulers.obj, function () {
          toggleRulers();
        });

        evt.attach(TAP_EVT.PUSH, toggles.guides.obj, function () {
          toggleGuides();
        });

        evt.attach(TAP_EVT.PUSH, toggles.all.obj, function () {
          if (rulerStatus === 1 || guideStatus === 1) {
            rulerStatus = 1;
            guideStatus = 1;
            wrapper.style.display = 'none';
          } else {
            rulerStatus = 0;
            guideStatus = 0;
            wrapper.style.display = 'block';
          }

          toggleRulers();
          toggleGuides();
        });

        evt.attach(TAP_EVT.PUSH, toggles.config.obj, function () {
          configDialog.open();
        });

        evt.attach(TAP_EVT.PUSH, toggles.clear.obj, function () {
          deleteGuides();
        });

        evt.attach(TAP_EVT.PUSH, toggles.open.obj, function () {
          openGridDialog.open();
        });

        evt.attach(TAP_EVT.PUSH, toggles.save.obj, function () {
          saveGrid();
        });

        evt.attach(TAP_EVT.PUSH, toggles.snap.obj, function () {
          snapDialog.open();
        });

        evt.attach(TAP_EVT.PUSH, toggles.details.obj, function () {
          detailsStatus = 1 - detailsStatus;
          showDetailedInfo();
        });

        evt.attach(TAP_EVT.PUSH, toggles.snapdom.obj, function () {
          snapDom = 1 - snapDom;

          if (snapDom === 1) {
            domDimensions = calculateDomDimensions();
          }
        });

        menuList.appendChild(menuItems);

        rgContainer.appendChild(menuBtn);
        rgContainer.appendChild(menuList);

        evt.attach(TAP_EVT.PUSH, menuBtn, function () {
          toggles.rulers.txt.nodeValue = (rulerStatus === 1) ? 'Hide rulers' : 'Show rulers';
          toggles.guides.txt.nodeValue = (guideStatus === 1) ? 'Hide guides' : 'Show guides';

          if (guidesCnt > 0) {
            toggles.guides.obj.className = '';
            toggles.clear.obj.className = '';
            toggles.save.obj.className = '';
          } else {
            toggles.guides.obj.className = 'disabled';
            toggles.clear.obj.className = 'disabled';
            toggles.save.obj.className = 'disabled';
          }

          toggles.all.txt.nodeValue = (rulerStatus === 1 || guideStatus === 1) ? 'Hide all' : 'Show all';
          toggles.details.txt.nodeValue = (detailsStatus === 0) ? 'Show detail info' : 'Hide detail info';
          toggles.snapdom.txt.nodeValue = (snapDom === 0) ? 'Snap to DOM' : 'NOT snap to DOM';
          toggles.open.obj.className = (gridListLen > 0) ? '' : 'disabled';

          menuList.style.display = (status === 0) ? 'inline-block' : 'none';

          status = 1 - status;
        });
      };

      this.render();

      this.close = function () {
        if (menuList !== null) {
          menuList.style.display = 'none';
          status = 0;
        }
      };
    };
    var SnapDialog = function () {
      var dialog = null;
      var xInput = null;
      var yInput = null;
      var self = this;

      this.render = function () {
        if (dialog === null) {
          dialog = create('div');
          xInput = create('input');
          yInput = xInput.cloneNode(false);

          var text = document.createTextNode('');
          var okBtn = create('button');
          var xLabel = create('label');
          var titleBar = dialog.cloneNode(false);
          var dialogWrapper = dialog.cloneNode(false);
          var inputWrapper = dialog.cloneNode(false);
          var btnWrapper = dialog.cloneNode(false);
          var resetBtn = okBtn.cloneNode(false);
          var cancelBtn = okBtn.cloneNode(false);
          var yLabel = xLabel.cloneNode(false);
          var titleBarTxt = text.cloneNode(false);
          var xLabelTxt = text.cloneNode(false);
          var yLabelTxt = text.cloneNode(false);
          var okBtnTxt = text.cloneNode(false);
          var resetBtnTxt = text.cloneNode(false);
          var cancelBtnTxt = text.cloneNode(false);

          titleBarTxt.nodeValue = 'Snap Dialog: snap guides to';
          xLabelTxt.nodeValue = 'X';
          yLabelTxt.nodeValue = 'Y';
          okBtnTxt.nodeValue = 'OK';
          resetBtnTxt.nodeValue = 'Reset';
          cancelBtnTxt.nodeValue = 'Close';

          dialog.className = 'dialog snap-dialog';
          titleBar.className = 'title-bar';
          dialogWrapper.className = 'wrapper';

          xLabel.className = 'rg-x-label';
          xLabel.setAttribute('for', 'rg-x-snap');

          yLabel.className = 'rg-y-label';
          yLabel.setAttribute('for', 'rg-y-snap');

          xInput.setAttribute('type', 'number');
          xInput.value = xSnap;
          xInput.id = 'rg-x-snap';

          xInput.setAttribute('type', 'number');
          yInput.value = ySnap;
          yInput.id = 'rg-y-snap';

          okBtn.className = 'ok-btn';
          resetBtn.className = 'reset-btn';
          cancelBtn.className = 'cancel-btn';

          titleBar.appendChild(titleBarTxt);

          xLabel.appendChild(xLabelTxt);
          yLabel.appendChild(yLabelTxt);
          okBtn.appendChild(okBtnTxt);
          resetBtn.appendChild(resetBtnTxt);
          cancelBtn.appendChild(cancelBtnTxt);

          inputWrapper.appendChild(xLabel);
          inputWrapper.appendChild(xInput);
          inputWrapper.appendChild(yLabel);
          inputWrapper.appendChild(yInput);
          inputWrapper.appendChild(resetBtn);

          btnWrapper.appendChild(okBtn);
          btnWrapper.appendChild(cancelBtn);

          dialogWrapper.appendChild(inputWrapper);
          dialogWrapper.appendChild(btnWrapper);

          dialog.appendChild(titleBar);
          dialog.appendChild(dialogWrapper);

          rgContainer.appendChild(dialog);

          evt.attach(TAP_EVT.PUSH, okBtn, function () {
            xSnap = parseInt(xInput.value, 10) || 0;
            ySnap = parseInt(yInput.value, 10) || 0;
            xInput.value = xSnap;
            yInput.value = ySnap;
            // self.close();
          });

          evt.attach(TAP_EVT.PUSH, resetBtn, function () {
            xSnap = 1;
            ySnap = 1;
            xInput.value = xSnap;
            yInput.value = ySnap;
            // self.close();
          });

          evt.attach(TAP_EVT.PUSH, cancelBtn, function () {
            self.close();
          });
        }
      };

      this.render();

      this.open = function () {
        closeAllDialogs();

        dialog.style.display = 'block';
        dialog.style.left = ((doc.clientWidth - dialog.clientWidth) / 2) + 'px';
        dialog.style.top = ((doc.clientHeight - dialog.clientHeight) / 2) + 'px';
      };

      this.close = function () {
        dialog.style.display = 'none';
      };
    };
    var prepare = function () {
      var style = create('style');
      var size = getWindowSize();
      var elements = document.getElementsByTagName('*');
      var len = elements.length;
      var i = 0;

      for (i; i < len; i += 1) {
        domElements.push(elements[i]);
      }

      style.setAttribute('type', 'text/css');

      if (style.styleSheet) {
        style.styleSheet.cssText = cssText;
      } else {
        style.appendChild(document.createTextNode(cssText));
      }

      // rgContainer.appendChild(style);

      setTimeout(function () {
        hRuler = new Ruler('h', 3000);
        vRuler = new Ruler('v', 7000);

        wrapper = create('div');
        gInfoBlockWrapper = wrapper.cloneNode(false);

        wrapper.className = 'rg-overlay';
        gInfoBlockWrapper.className = 'info-block-wrapper';

        wrapper.style.width = (size[0]) + 'px';
        wrapper.style.height = (size[1]) + 'px';

        wrapper.appendChild(hRuler);
        wrapper.appendChild(vRuler);
        wrapper.appendChild(gInfoBlockWrapper);

        rgContainer.appendChild(wrapper);

        domDimensions = calculateDomDimensions();

        menu = new Menu();
        snapDialog = new SnapDialog();
        openGridDialog = new OpenGridDialog();

        dialogs = [snapDialog, openGridDialog, configDialog];

        if (rulerStatus === 1 || guideStatus === 1) {
          rulerStatus = 1;
          guideStatus = 1;
          wrapper.style.display = 'none';
        } else {
          guideStatus = 0;
          rulerStatus = 0;
          wrapper.style.display = 'block';
        }
        toggleRulers();
        toggleGuides();
      }, 10);
    };

    prepare();

    this.status = 1;

    this.disable = function () {
      if (vRuler !== null) {
        deleteGuides();

        vRuler.style.display = 'none';
        hRuler.style.display = 'none';
        wrapper.style.display = 'none';
        menuBtn.style.display = 'none';
      }

      rulerStatus = 0;
      this.status = 0;
    };

    this.enable = function () {
      if (vRuler !== null) {
        vRuler.style.display = 'block';
        hRuler.style.display = 'block';
        wrapper.style.display = 'block';
        menuBtn.style.display = 'block';
      }

      rulerStatus = 1;
      this.status = 1;
    };

    evt.attach(TAP_EVT.PUSH, document, function (e, src) {
      var x = e.clientX;
      var y = e.clientY;
      var guide = null;
      var guideInfo = null;
      var guideInfoText = null;
      var scrollPos = getScrollPos();
      var snap = 0;

      if (src.className.indexOf('menu-btn') === -1) {
        menu.close();
      }

      if (vBound === 0) {
        vBound = vRuler.offsetWidth;
        hBound = hRuler.offsetHeight;
      }

      if (
        (
          (x > vBound && y < hBound) ||
                    (y > hBound && x < vBound)
        ) && rulerStatus === 1
      ) {
        guide = create('div');
        guideInfo = guide.cloneNode(false);
        guideInfoText = document.createTextNode('');

        gUid = 'guide-' + guidesCnt;

        guideInfo.className = 'info';

        guideInfo.appendChild(guideInfoText);
        guide.appendChild(guideInfo);

        if (x > vBound && y < hBound) {
          guide.className = 'guide h draggable';
          guide.style.top = (e.clientY + scrollPos[0]) + 'px';
          guideInfo.style.left = (x + scrollPos[1] + 10) + 'px';
          guide.type = 'h';
          snap = ySnap;
          mode = 2;
        } else if (y > hBound && x < vBound) {
          guide.className = 'guide v draggable';
          guide.style.left = (x + scrollPos[1]) + 'px';
          guideInfo.style.top = ((y + scrollPos[0]) - 35) + 'px';
          guide.type = 'v';
          snap = xSnap;
          mode = 1;
        }

        guide.id = gUid;
        guide.info = guideInfo;
        guide.text = guideInfoText;
        guide.x = 0;
        guide.y = 0;

        guides[gUid] = guide;

        wrapper.appendChild(guide);

        dragdrop.set(guide, {
          mode: mode,
          onstart: function (elem) {
            var text = (elem.mode === 1)
              ? parseInt(elem.style.left, 10)
              : parseInt(elem.style.top, 10);

            elem.text.nodeValue = text + 'px';
            elem.over = elem.over || evt.attach(TAP_EVT.OVER, elem, function (eX, srcX) {
              if (srcX.className === 'guide v draggable') {
                srcX.info.style.top = (eX.clientY + scrollPos[0] - 35) + 'px';
              } else if (srcX.className === 'guide h draggable') {
                srcX.info.style.left = (eX.clientX + scrollPos[1] + 10) + 'px';
              }
            });
            // elem.out = elem.out || evt.attach(TAP_EVT.OUT, elem, function (e, src) { });
          },
          onmove: function (elem) {
            var text = '';
            var pos = 0;
            var dims = [];
            var len = 0;
            var i = 0;

            pos = (elem.mode === 1) ? elem.style.left : elem.style.top;
            pos = parseInt(pos, 10);

            if (snapDom === 1) {
              dims = domDimensions[elem.mode - 1];

              for (i, len = dims.length; i < len; i += 1) {
                if (pos <= dims[i]) {
                  pos = dims[i];
                  break;
                }
              }
            }

            text = pos + 'px';

            if (elem.mode === 1) {
              elem.style.left = pos + 'px';
              elem.x = pos;
            } else {
              elem.style.top = pos + 'px';
              elem.y = pos;
            }

            elem.text.nodeValue = text;
          },
          onstop: function (elem) {
            var min;
            var max;
            var offset = parseInt(elem.info.innerHTML, 10) || 0;
            if (elem.className === 'guide v draggable') {
              min = 0 && document.querySelector('.ruler.v').clientWidth;
              max = doc.clientWidth;
              if (offset <= min || offset >= max) {
                elem = elem.remove();
              }
            } else if (elem.className === 'guide h draggable') {
              min = 0 && document.querySelector('.ruler.h').clientHeight;
              max = doc.clientHeight;
              if (offset <= min || offset >= max) {
                elem = elem.remove();
              }
            }
            // elem.over && evt.detach(TAP_EVT.OVER, elem, elem.over);
            // elem.out && evt.detach(TAP_EVT.OUT, elem, elem.out);
          },
          snap: snap
        });

        dragdrop.start(e, guide);

        guidesCnt += 1;
      }
    });

    evt.attach(TAP_EVT.RELEASE, document, function (e, src) {
      removeInboundGuide(src, src.id);

      if (detailsStatus === 1) {
        showDetailedInfo();
      }
    });

    evt.attach('keyup', document, function (e) {
      if (e.ctrlKey === true && e.altKey === true) {
        switch (e.keyCode) {
          case 83:
            saveGrid();
            break;
          case 82:
            toggleRulers();
            break;
          case 79:
            openGridDialog.open();
            break;
          case 76:
            configDialog.open();
            break;
          case 73:
            detailsStatus = 1 - detailsStatus;
            showDetailedInfo();
            break;
          case 71:
            toggleGuides();
            break;
          case 69:
            snapDom = 1 - snapDom;
            if (snapDom === 1) {
              domDimensions = calculateDomDimensions();
            }
            break;
          case 68:
            deleteGuides();
            break;
          case 67:
            snapDialog.open();
            break;
          case 65:
            if (rulerStatus === 1 || guideStatus === 1) {
              rulerStatus = 1;
              guideStatus = 1;
              wrapper.style.display = 'none';
            } else {
              rulerStatus = 0;
              guideStatus = 0;
              wrapper.style.display = 'block';
            }
            toggleRulers();
            toggleGuides();
            break;
          default:
            break;
        }
      }
    });

    evt.attach('resize', window, function () {
      var size = getWindowSize();

      wrapper.style.width = size[0] + 'px';
      wrapper.style.height = size[1] + 'px';

      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }

      if (snapDom === 1) {
        resizeTimer = window.setTimeout(function () {
          domDimensions = calculateDomDimensions();
        }, 100);
      }
    });
  };

  // 禁止滚动的函数
  var MaskHelper = (function (fixCls) {
    var offset = {
      top: null,
      left: null
    };
    var html = document.scrollingElement || document.documentElement;
    var body = document.body;

    if (!fixCls || typeof fixCls !== 'string') {
      fixCls = '';
    }
    return {
      isLock: function () {
        var htmlClass = ' ' + html.className.replace(/\s+/g, ' ') + ' ';
        var bodyClass = ' ' + body.className.replace(/\s+/g, ' ') + ' ';
        var lockClass = ' ' + fixCls.replace(/\s+/g, ' ') + ' ';
        return htmlClass.indexOf(lockClass) > -1 || bodyClass.indexOf(lockClass) > -1;
      },
      openMask: function () {
        var root = document.scrollingElement;
        if (!root) {
          root = html.scrollHeight > body.scrollHeight ? html : body;
        }
        if (MaskHelper.isLock()) {
          return;
        }

        offset.top = root.scrollTop;
        offset.left = root.scrollLeft;

        html.classList.add(fixCls);
        body.classList.add(fixCls);

        root.style.top = -offset.top + 'px';
        root.style.left = -offset.left + 'px';
      },
      closeMask: function () {
        if (!MaskHelper.isLock()) {
          return;
        }

        html.classList.remove(fixCls);
        body.classList.remove(fixCls);

        html.scrollTop = offset.top;
        html.scrollLeft = offset.left;
        body.scrollTop = offset.top;
        body.scrollLeft = offset.left;
      }
    };
  })('mask-back-fixed');
    // 创建的函数
  var create = function (tag, html, attrs) {
    var element = document.createElement(tag || 'div');
    element.innerHTML = html || '';
    for (var key in (attrs || {})) {
      if (forloop(attrs, key)) {
        element.setAttribute(key, attrs[key]);
      }
    }
    return element;
  };
  var getStyle = function (ele) {
    return document.defaultView.getComputedStyle
      ? document.defaultView.getComputedStyle(ele)
      : ele.currentStyle;
  };
  var forloop = function (obj, key) {
    return {}.hasOwnProperty.call(obj, key);
  };
  // 定义常量和初始化
  var RULERS_GUIDES_ID = 'RulersGuides';
  var TAP_EVT = 'ontouchstart' in window ? {
    PUSH: 'touchstart',
    MOVE: 'touchmove',
    OVER: 'touchstart',
    OUT: 'touchend',
    RELEASE: 'touchend'
  } : {
    PUSH: 'mousedown',
    MOVE: 'mousemove',
    OVER: 'mouseover',
    OUT: 'mouseout',
    RELEASE: 'mouseup'
  };
  var evt = new Event();
  evt.attach('error', window, function (e) {
    var error = e && e.error;
    var message = error && error.message;
    var stack = error && error.stack;
    window.alert(message + '\n----------\n' + stack);
    return true;
  });
  var dragdrop = new Dragdrop(evt);
  var rg = new RulersGuides(evt, dragdrop);

  setTimeout(function () {
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    if (vw / vh > 9 / 16) {
      // 425*706  85vmin * 140vmin
      document.querySelector('.config-dialog').style.transform = 'translate(-50%, -50%) scale(' +
      (vw > vh ? 5 / 7 : (vw / vh)).toFixed(3) + ')';
    }
  }, 300);
  return rg;
}());
