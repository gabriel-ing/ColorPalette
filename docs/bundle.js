(function () {
  'use strict';

  var noop = {value: () => {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames$1(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames$1(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get$1(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set$1(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  var xhtml = "http://www.w3.org/1999/xhtml";

  var namespaces = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
  }

  function creatorInherit(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml && document.documentElement.namespaceURI === xhtml
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator(name) {
    var fullname = namespace(name);
    return (fullname.local
        ? creatorFixed
        : creatorInherit)(fullname);
  }

  function none() {}

  function selector(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select(select) {
    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection$1(subgroups, this._parents);
  }

  // Given something array like (or null), returns something that is strictly an
  // array. This is used to ensure that array-like objects passed to d3.selectAll
  // or selection.selectAll are converted into proper arrays when creating a
  // selection; we don’t ever want to create a selection backed by a live
  // HTMLCollection or NodeList. However, note that selection.selectAll will use a
  // static NodeList as a group, since it safely derived from querySelectorAll.
  function array(x) {
    return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
  }

  function empty() {
    return [];
  }

  function selectorAll(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  function arrayAll(select) {
    return function() {
      return array(select.apply(this, arguments));
    };
  }

  function selection_selectAll(select) {
    if (typeof select === "function") select = arrayAll(select);
    else select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection$1(subgroups, parents);
  }

  function matcher(selector) {
    return function() {
      return this.matches(selector);
    };
  }

  function childMatcher(selector) {
    return function(node) {
      return node.matches(selector);
    };
  }

  var find = Array.prototype.find;

  function childFind(match) {
    return function() {
      return find.call(this.children, match);
    };
  }

  function childFirst() {
    return this.firstElementChild;
  }

  function selection_selectChild(match) {
    return this.select(match == null ? childFirst
        : childFind(typeof match === "function" ? match : childMatcher(match)));
  }

  var filter = Array.prototype.filter;

  function children() {
    return Array.from(this.children);
  }

  function childrenFilter(match) {
    return function() {
      return filter.call(this.children, match);
    };
  }

  function selection_selectChildren(match) {
    return this.selectAll(match == null ? children
        : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
  }

  function selection_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection$1(subgroups, this._parents);
  }

  function sparse(update) {
    return new Array(update.length);
  }

  function selection_enter() {
    return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
  }

  function EnterNode(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant$1(x) {
    return function() {
      return x;
    };
  }

  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = new Map,
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
        if (nodeByKeyValue.has(keyValue)) {
          exit[i] = node;
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = key.call(parent, data[i], i, data) + "";
      if (node = nodeByKeyValue.get(keyValue)) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue.delete(keyValue);
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
        exit[i] = node;
      }
    }
  }

  function datum(node) {
    return node.__data__;
  }

  function selection_data(value, key) {
    if (!arguments.length) return Array.from(this, datum);

    var bind = key ? bindKey : bindIndex,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant$1(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection$1(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  // Given some data, this returns an array-like view of it: an object that
  // exposes a length property and allows numeric indexing. Note that unlike
  // selectAll, this isn’t worried about “live” collections because the resulting
  // array will only be used briefly while data is being bound. (It is possible to
  // cause the data to change while iterating by using a key function, but please
  // don’t; we’d rather avoid a gratuitous copy.)
  function arraylike(data) {
    return typeof data === "object" && "length" in data
      ? data // Array, TypedArray, NodeList, array-like
      : Array.from(data); // Map, Set, iterable, string, or anything else
  }

  function selection_exit() {
    return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
  }

  function selection_join(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    if (typeof onenter === "function") {
      enter = onenter(enter);
      if (enter) enter = enter.selection();
    } else {
      enter = enter.append(onenter + "");
    }
    if (onupdate != null) {
      update = onupdate(update);
      if (update) update = update.selection();
    }
    if (onexit == null) exit.remove(); else onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  function selection_merge(context) {
    var selection = context.selection ? context.selection() : context;

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection$1(merges, this._parents);
  }

  function selection_order() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort(compare) {
    if (!compare) compare = ascending;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection$1(sortgroups, this._parents).order();
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes() {
    return Array.from(this);
  }

  function selection_node() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size() {
    let size = 0;
    for (const node of this) ++size; // eslint-disable-line no-unused-vars
    return size;
  }

  function selection_empty() {
    return !this.node();
  }

  function selection_each(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove$1(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS$1(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant$1(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS$1(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction$1(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS$1(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr(name, value) {
    var fullname = namespace(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
        : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
  }

  function defaultView(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove$1(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant$1(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction$1(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove$1 : typeof value === "function"
              ? styleFunction$1
              : styleConstant$1)(name, value, priority == null ? "" : priority))
        : styleValue(this.node(), name);
  }

  function styleValue(node, name) {
    return node.style.getPropertyValue(name)
        || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove : typeof value === "function"
            ? propertyFunction
            : propertyConstant)(name, value))
        : this.node()[name];
  }

  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList(node) {
    return node.classList || new ClassList(node);
  }

  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }

  ClassList.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }

  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }

  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }

  function selection_classed(name, value) {
    var names = classArray(name + "");

    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction : value
        ? classedTrue
        : classedFalse)(names, value));
  }

  function textRemove() {
    this.textContent = "";
  }

  function textConstant$1(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction$1(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove : (typeof value === "function"
            ? textFunction$1
            : textConstant$1)(value))
        : this.node().textContent;
  }

  function htmlRemove() {
    this.innerHTML = "";
  }

  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove : (typeof value === "function"
            ? htmlFunction
            : htmlConstant)(value))
        : this.node().innerHTML;
  }

  function raise() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise() {
    return this.each(raise);
  }

  function lower() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower() {
    return this.each(lower);
  }

  function selection_append(name) {
    var create = typeof name === "function" ? name : creator(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull() {
    return null;
  }

  function selection_insert(name, before) {
    var create = typeof name === "function" ? name : creator(name),
        select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove() {
    return this.each(remove);
  }

  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_clone(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  function selection_datum(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  function contextListener(listener) {
    return function(event) {
      listener.call(this, event, this.__data__);
    };
  }

  function parseTypenames(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd(typename, value, options) {
    return function() {
      var on = this.__on, o, listener = contextListener(value);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, options);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on(typename, value, options) {
    var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd : onRemove;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
    return this;
  }

  function dispatchEvent(node, type, params) {
    var window = defaultView(node),
        event = window.CustomEvent;

    if (typeof event === "function") {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant(type, params) {
    return function() {
      return dispatchEvent(this, type, params);
    };
  }

  function dispatchFunction(type, params) {
    return function() {
      return dispatchEvent(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction
        : dispatchConstant)(type, params));
  }

  function* selection_iterator() {
    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) yield node;
      }
    }
  }

  var root = [null];

  function Selection$1(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection() {
    return new Selection$1([[document.documentElement]], root);
  }

  function selection_selection() {
    return this;
  }

  Selection$1.prototype = selection.prototype = {
    constructor: Selection$1,
    select: selection_select,
    selectAll: selection_selectAll,
    selectChild: selection_selectChild,
    selectChildren: selection_selectChildren,
    filter: selection_filter,
    data: selection_data,
    enter: selection_enter,
    exit: selection_exit,
    join: selection_join,
    merge: selection_merge,
    selection: selection_selection,
    order: selection_order,
    sort: selection_sort,
    call: selection_call,
    nodes: selection_nodes,
    node: selection_node,
    size: selection_size,
    empty: selection_empty,
    each: selection_each,
    attr: selection_attr,
    style: selection_style,
    property: selection_property,
    classed: selection_classed,
    text: selection_text,
    html: selection_html,
    raise: selection_raise,
    lower: selection_lower,
    append: selection_append,
    insert: selection_insert,
    remove: selection_remove,
    clone: selection_clone,
    datum: selection_datum,
    on: selection_on,
    dispatch: selection_dispatch,
    [Symbol.iterator]: selection_iterator
  };

  function select(selector) {
    return typeof selector === "string"
        ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
        : new Selection$1([[selector]], root);
  }

  function define(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}

  var darker = 0.7;
  var brighter = 1 / darker;

  var reI = "\\s*([+-]?\\d+)\\s*",
      reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
      reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
      reHex = /^#([0-9a-f]{3,8})$/,
      reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
      reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
      reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
      reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
      reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
      reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };

  define(Color, color$1, {
    copy(channels) {
      return Object.assign(new this.constructor, this, channels);
    },
    displayable() {
      return this.rgb().displayable();
    },
    hex: color_formatHex, // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHex8: color_formatHex8,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });

  function color_formatHex() {
    return this.rgb().formatHex();
  }

  function color_formatHex8() {
    return this.rgb().formatHex8();
  }

  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }

  function color_formatRgb() {
    return this.rgb().formatRgb();
  }

  function color$1(format) {
    var m, l;
    format = (format + "").trim().toLowerCase();
    return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
        : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
        : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
        : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
        : null) // invalid hex
        : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
        : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
        : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color$1(o);
    if (!o) return new Rgb;
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Rgb, rgb, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return (-0.5 <= this.r && this.r < 255.5)
          && (-0.5 <= this.g && this.g < 255.5)
          && (-0.5 <= this.b && this.b < 255.5)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex, // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));

  function rgb_formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }

  function rgb_formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
  }

  function rgb_formatRgb() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
  }

  function clampa(opacity) {
    return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
  }

  function clampi(value) {
    return Math.max(0, Math.min(255, Math.round(value) || 0));
  }

  function hex(value) {
    value = clampi(value);
    return (value < 16 ? "0" : "") + value.toString(16);
  }

  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color$1(o);
    if (!o) return new Hsl;
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hsl, hsl, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l + (l < 0.5 ? l : 1 - l) * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
          && (0 <= this.l && this.l <= 1)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl() {
      const a = clampa(this.opacity);
      return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
    }
  }));

  function clamph(value) {
    value = (value || 0) % 360;
    return value < 0 ? value + 360 : value;
  }

  function clampt(value) {
    return Math.max(0, Math.min(1, value || 0));
  }

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
        : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
        : m1) * 255;
  }

  var constant = x => () => x;

  function linear(a, d) {
    return function(t) {
      return a + t * d;
    };
  }

  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant(isNaN(a) ? b : a);
  }

  var interpolateRgb = (function rgbGamma(y) {
    var color = gamma(y);

    function rgb$1(start, end) {
      var r = color((start = rgb(start)).r, (end = rgb(end)).r),
          g = color(start.g, end.g),
          b = color(start.b, end.b),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }

    rgb$1.gamma = rgbGamma;

    return rgb$1;
  })(1);

  function interpolateNumber(a, b) {
    return a = +a, b = +b, function(t) {
      return a * (1 - t) + b * t;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
      reB = new RegExp(reA.source, "g");

  function zero(b) {
    return function() {
      return b;
    };
  }

  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }

  function interpolateString(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
        && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: interpolateNumber(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one(q[0].x)
        : zero(b))
        : (b = q.length, function(t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join("");
          });
  }

  var degrees = 180 / Math.PI;

  var identity = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };

  function decompose(a, b, c, d, e, f) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX: scaleX,
      scaleY: scaleY
    };
  }

  var svgNode;

  /* eslint-disable no-undef */
  function parseCss(value) {
    const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
    return m.isIdentity ? identity : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
  }

  function parseSvg(value) {
    if (value == null) return identity;
    if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
    value = value.matrix;
    return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  function interpolateTransform(parse, pxComma, pxParen, degParen) {

    function pop(s) {
      return s.length ? s.pop() + " " : "";
    }

    function translate(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push("translate(", null, pxComma, null, pxParen);
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb || yb) {
        s.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }

    function rotate(a, b, s, q) {
      if (a !== b) {
        if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
        q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "rotate(" + b + degParen);
      }
    }

    function skewX(a, b, s, q) {
      if (a !== b) {
        q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "skewX(" + b + degParen);
      }
    }

    function scale(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push(pop(s) + "scale(", null, ",", null, ")");
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb !== 1 || yb !== 1) {
        s.push(pop(s) + "scale(" + xb + "," + yb + ")");
      }
    }

    return function(a, b) {
      var s = [], // string constants and placeholders
          q = []; // number interpolators
      a = parse(a), b = parse(b);
      translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
      rotate(a.rotate, b.rotate, s, q);
      skewX(a.skewX, b.skewX, s, q);
      scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
      a = b = null; // gc
      return function(t) {
        var i = -1, n = q.length, o;
        while (++i < n) s[(o = q[i]).i] = o.x(t);
        return s.join("");
      };
    };
  }

  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  var frame = 0, // is an animation frame pending?
      timeout$1 = 0, // is a timeout pending?
      interval = 0, // are any timers active?
      pokeDelay = 1000, // how frequently we check for clock skew
      taskHead,
      taskTail,
      clockLast = 0,
      clockNow = 0,
      clockSkew = 0,
      clock = typeof performance === "object" && performance.now ? performance : Date,
      setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }

  function clearNow() {
    clockNow = 0;
  }

  function Timer() {
    this._call =
    this._time =
    this._next = null;
  }

  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;
        else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };

  function timer(callback, delay, time) {
    var t = new Timer;
    t.restart(callback, delay, time);
    return t;
  }

  function timerFlush() {
    now(); // Get the current time, if not already set.
    ++frame; // Pretend we’ve set an alarm, if we haven’t already.
    var t = taskHead, e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
      t = t._next;
    }
    --frame;
  }

  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout$1 = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }

  function poke() {
    var now = clock.now(), delay = now - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
  }

  function nap() {
    var t0, t1 = taskHead, t2, time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t2 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t2 : taskHead = t2;
      }
    }
    taskTail = t0;
    sleep(time);
  }

  function sleep(time) {
    if (frame) return; // Soonest alarm already set, or will be.
    if (timeout$1) timeout$1 = clearTimeout(timeout$1);
    var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
    if (delay > 24) {
      if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  function timeout(callback, delay, time) {
    var t = new Timer;
    delay = delay == null ? 0 : +delay;
    t.restart(elapsed => {
      t.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t;
  }

  var emptyOn = dispatch("start", "end", "cancel", "interrupt");
  var emptyTween = [];

  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var RUNNING = 4;
  var ENDING = 5;
  var ENDED = 6;

  function schedule(node, name, id, index, group, timing) {
    var schedules = node.__transition;
    if (!schedules) node.__transition = {};
    else if (id in schedules) return;
    create(node, id, {
      name: name,
      index: index, // For context during callback.
      group: group, // For context during callback.
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }

  function init(node, id) {
    var schedule = get(node, id);
    if (schedule.state > CREATED) throw new Error("too late; already scheduled");
    return schedule;
  }

  function set(node, id) {
    var schedule = get(node, id);
    if (schedule.state > STARTED) throw new Error("too late; already running");
    return schedule;
  }

  function get(node, id) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
    return schedule;
  }

  function create(node, id, self) {
    var schedules = node.__transition,
        tween;

    // Initialize the self timer when the transition is created.
    // Note the actual delay is not known until the first callback!
    schedules[id] = self;
    self.timer = timer(schedule, 0, self.time);

    function schedule(elapsed) {
      self.state = SCHEDULED;
      self.timer.restart(start, self.delay, self.time);

      // If the elapsed delay is less than our first sleep, start immediately.
      if (self.delay <= elapsed) start(elapsed - self.delay);
    }

    function start(elapsed) {
      var i, j, n, o;

      // If the state is not SCHEDULED, then we previously errored on start.
      if (self.state !== SCHEDULED) return stop();

      for (i in schedules) {
        o = schedules[i];
        if (o.name !== self.name) continue;

        // While this element already has a starting transition during this frame,
        // defer starting an interrupting transition until that transition has a
        // chance to tick (and possibly end); see d3/d3-transition#54!
        if (o.state === STARTED) return timeout(start);

        // Interrupt the active transition, if any.
        if (o.state === RUNNING) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("interrupt", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }

        // Cancel any pre-empted transitions.
        else if (+i < id) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("cancel", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }
      }

      // Defer the first tick to end of the current frame; see d3/d3#1576.
      // Note the transition may be canceled after start and before the first tick!
      // Note this must be scheduled before the start event; see d3/d3-transition#16!
      // Assuming this is successful, subsequent callbacks go straight to tick.
      timeout(function() {
        if (self.state === STARTED) {
          self.state = RUNNING;
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });

      // Dispatch the start event.
      // Note this must be done before the tween are initialized.
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING) return; // interrupted
      self.state = STARTED;

      // Initialize the tween, deleting null tween.
      tween = new Array(n = self.tween.length);
      for (i = 0, j = -1; i < n; ++i) {
        if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j] = o;
        }
      }
      tween.length = j + 1;
    }

    function tick(elapsed) {
      var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
          i = -1,
          n = tween.length;

      while (++i < n) {
        tween[i].call(node, t);
      }

      // Dispatch the end event.
      if (self.state === ENDING) {
        self.on.call("end", node, node.__data__, self.index, self.group);
        stop();
      }
    }

    function stop() {
      self.state = ENDED;
      self.timer.stop();
      delete schedules[id];
      for (var i in schedules) return; // eslint-disable-line no-unused-vars
      delete node.__transition;
    }
  }

  function interrupt(node, name) {
    var schedules = node.__transition,
        schedule,
        active,
        empty = true,
        i;

    if (!schedules) return;

    name = name == null ? null : name + "";

    for (i in schedules) {
      if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
      active = schedule.state > STARTING && schedule.state < ENDING;
      schedule.state = ENDED;
      schedule.timer.stop();
      schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
      delete schedules[i];
    }

    if (empty) delete node.__transition;
  }

  function selection_interrupt(name) {
    return this.each(function() {
      interrupt(this, name);
    });
  }

  function tweenRemove(id, name) {
    var tween0, tween1;
    return function() {
      var schedule = set(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i, 1);
            break;
          }
        }
      }

      schedule.tween = tween1;
    };
  }

  function tweenFunction(id, name, value) {
    var tween0, tween1;
    if (typeof value !== "function") throw new Error;
    return function() {
      var schedule = set(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1[i] = t;
            break;
          }
        }
        if (i === n) tween1.push(t);
      }

      schedule.tween = tween1;
    };
  }

  function transition_tween(name, value) {
    var id = this._id;

    name += "";

    if (arguments.length < 2) {
      var tween = get(this.node(), id).tween;
      for (var i = 0, n = tween.length, t; i < n; ++i) {
        if ((t = tween[i]).name === name) {
          return t.value;
        }
      }
      return null;
    }

    return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
  }

  function tweenValue(transition, name, value) {
    var id = transition._id;

    transition.each(function() {
      var schedule = set(this, id);
      (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
    });

    return function(node) {
      return get(node, id).value[name];
    };
  }

  function interpolate(a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber
        : b instanceof color$1 ? interpolateRgb
        : (c = color$1(b)) ? (b = c, interpolateRgb)
        : interpolateString)(a, b);
  }

  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttribute(name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrConstantNS(fullname, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttributeNS(fullname.space, fullname.local);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrFunction(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttribute(name);
      string0 = this.getAttribute(name);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function attrFunctionNS(fullname, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
      string0 = this.getAttributeNS(fullname.space, fullname.local);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function transition_attr(name, value) {
    var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
    return this.attrTween(name, typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
        : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
        : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
  }

  function attrInterpolate(name, i) {
    return function(t) {
      this.setAttribute(name, i.call(this, t));
    };
  }

  function attrInterpolateNS(fullname, i) {
    return function(t) {
      this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
    };
  }

  function attrTweenNS(fullname, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function attrTween(name, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_attrTween(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    var fullname = namespace(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  function delayFunction(id, value) {
    return function() {
      init(this, id).delay = +value.apply(this, arguments);
    };
  }

  function delayConstant(id, value) {
    return value = +value, function() {
      init(this, id).delay = value;
    };
  }

  function transition_delay(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? delayFunction
            : delayConstant)(id, value))
        : get(this.node(), id).delay;
  }

  function durationFunction(id, value) {
    return function() {
      set(this, id).duration = +value.apply(this, arguments);
    };
  }

  function durationConstant(id, value) {
    return value = +value, function() {
      set(this, id).duration = value;
    };
  }

  function transition_duration(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? durationFunction
            : durationConstant)(id, value))
        : get(this.node(), id).duration;
  }

  function easeConstant(id, value) {
    if (typeof value !== "function") throw new Error;
    return function() {
      set(this, id).ease = value;
    };
  }

  function transition_ease(value) {
    var id = this._id;

    return arguments.length
        ? this.each(easeConstant(id, value))
        : get(this.node(), id).ease;
  }

  function easeVarying(id, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (typeof v !== "function") throw new Error;
      set(this, id).ease = v;
    };
  }

  function transition_easeVarying(value) {
    if (typeof value !== "function") throw new Error;
    return this.each(easeVarying(this._id, value));
  }

  function transition_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  function transition_merge(transition) {
    if (transition._id !== this._id) throw new Error;

    for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Transition(merges, this._parents, this._name, this._id);
  }

  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t) {
      var i = t.indexOf(".");
      if (i >= 0) t = t.slice(0, i);
      return !t || t === "start";
    });
  }

  function onFunction(id, name, listener) {
    var on0, on1, sit = start(name) ? init : set;
    return function() {
      var schedule = sit(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

      schedule.on = on1;
    };
  }

  function transition_on(name, listener) {
    var id = this._id;

    return arguments.length < 2
        ? get(this.node(), id).on.on(name)
        : this.each(onFunction(id, name, listener));
  }

  function removeFunction(id) {
    return function() {
      var parent = this.parentNode;
      for (var i in this.__transition) if (+i !== id) return;
      if (parent) parent.removeChild(this);
    };
  }

  function transition_remove() {
    return this.on("end.remove", removeFunction(this._id));
  }

  function transition_select(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
          schedule(subgroup[i], name, id, i, subgroup, get(node, id));
        }
      }
    }

    return new Transition(subgroups, this._parents, name, id);
  }

  function transition_selectAll(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
            if (child = children[k]) {
              schedule(child, name, id, k, children, inherit);
            }
          }
          subgroups.push(children);
          parents.push(node);
        }
      }
    }

    return new Transition(subgroups, parents, name, id);
  }

  var Selection = selection.prototype.constructor;

  function transition_selection() {
    return new Selection(this._groups, this._parents);
  }

  function styleNull(name, interpolate) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue(this, name),
          string1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, string10 = string1);
    };
  }

  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = styleValue(this, name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function styleFunction(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue(this, name),
          value1 = value(this),
          string1 = value1 + "";
      if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function styleMaybeRemove(id, name) {
    var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
    return function() {
      var schedule = set(this, id),
          on = schedule.on,
          listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

      schedule.on = on1;
    };
  }

  function transition_style(name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
    return value == null ? this
        .styleTween(name, styleNull(name, i))
        .on("end.style." + name, styleRemove(name))
      : typeof value === "function" ? this
        .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
        .each(styleMaybeRemove(this._id, name))
      : this
        .styleTween(name, styleConstant(name, i, value), priority)
        .on("end.style." + name, null);
  }

  function styleInterpolate(name, i, priority) {
    return function(t) {
      this.style.setProperty(name, i.call(this, t), priority);
    };
  }

  function styleTween(name, value, priority) {
    var t, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
      return t;
    }
    tween._value = value;
    return tween;
  }

  function transition_styleTween(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }

  function transition_text(value) {
    return this.tween("text", typeof value === "function"
        ? textFunction(tweenValue(this, "text", value))
        : textConstant(value == null ? "" : value + ""));
  }

  function textInterpolate(i) {
    return function(t) {
      this.textContent = i.call(this, t);
    };
  }

  function textTween(value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_textTween(value) {
    var key = "text";
    if (arguments.length < 1) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, textTween(value));
  }

  function transition_transition() {
    var name = this._name,
        id0 = this._id,
        id1 = newId();

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          var inherit = get(node, id0);
          schedule(node, name, id1, i, group, {
            time: inherit.time + inherit.delay + inherit.duration,
            delay: 0,
            duration: inherit.duration,
            ease: inherit.ease
          });
        }
      }
    }

    return new Transition(groups, this._parents, name, id1);
  }

  function transition_end() {
    var on0, on1, that = this, id = that._id, size = that.size();
    return new Promise(function(resolve, reject) {
      var cancel = {value: reject},
          end = {value: function() { if (--size === 0) resolve(); }};

      that.each(function() {
        var schedule = set(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) {
          on1 = (on0 = on).copy();
          on1._.cancel.push(cancel);
          on1._.interrupt.push(cancel);
          on1._.end.push(end);
        }

        schedule.on = on1;
      });

      // The selection was empty, resolve end immediately
      if (size === 0) resolve();
    });
  }

  var id = 0;

  function Transition(groups, parents, name, id) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id;
  }

  function newId() {
    return ++id;
  }

  var selection_prototype = selection.prototype;

  Transition.prototype = {
    constructor: Transition,
    select: transition_select,
    selectAll: transition_selectAll,
    selectChild: selection_prototype.selectChild,
    selectChildren: selection_prototype.selectChildren,
    filter: transition_filter,
    merge: transition_merge,
    selection: transition_selection,
    transition: transition_transition,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: transition_on,
    attr: transition_attr,
    attrTween: transition_attrTween,
    style: transition_style,
    styleTween: transition_styleTween,
    text: transition_text,
    textTween: transition_textTween,
    remove: transition_remove,
    tween: transition_tween,
    delay: transition_delay,
    duration: transition_duration,
    ease: transition_ease,
    easeVarying: transition_easeVarying,
    end: transition_end,
    [Symbol.iterator]: selection_prototype[Symbol.iterator]
  };

  function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  }

  var defaultTiming = {
    time: null, // Set on use.
    delay: 0,
    duration: 250,
    ease: cubicInOut
  };

  function inherit(node, id) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id])) {
      if (!(node = node.parentNode)) {
        throw new Error(`transition ${id} not found`);
      }
    }
    return timing;
  }

  function selection_transition(name) {
    var id,
        timing;

    if (name instanceof Transition) {
      id = name._id, name = name._name;
    } else {
      id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
    }

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          schedule(node, name, id, i, group, timing || inherit(node, id));
        }
      }
    }

    return new Transition(groups, this._parents, name, id);
  }

  selection.prototype.interrupt = selection_interrupt;
  selection.prototype.transition = selection_transition;

  function Transform(k, x, y) {
    this.k = k;
    this.x = x;
    this.y = y;
  }

  Transform.prototype = {
    constructor: Transform,
    scale: function(k) {
      return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
    },
    translate: function(x, y) {
      return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
    },
    apply: function(point) {
      return [point[0] * this.k + this.x, point[1] * this.k + this.y];
    },
    applyX: function(x) {
      return x * this.k + this.x;
    },
    applyY: function(y) {
      return y * this.k + this.y;
    },
    invert: function(location) {
      return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
    },
    invertX: function(x) {
      return (x - this.x) / this.k;
    },
    invertY: function(y) {
      return (y - this.y) / this.k;
    },
    rescaleX: function(x) {
      return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
    },
    rescaleY: function(y) {
      return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
    },
    toString: function() {
      return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
    }
  };

  new Transform(1, 0, 0);

  Transform.prototype;

  const colorPalette = () => {
    let baseColors;
    let margin = { top: 20, right: 10, bottom: 0, left: 120 };
    let nShades = 9;

    let padding = 10;
    const my = (selection) => {
      // console.log(selection);
      const width = selection.node().getBoundingClientRect().width;
      const height = selection.node().getBoundingClientRect().height;
      selection.attr("viewBox", `0 0 ${width} ${height}`);

      // console.log(baseColors);
      const tooltip = d3.select("#tooltip");

      const cols = selection
        .selectAll(".columns")
        .data(baseColors)
        .join("g")
        .attr("class", "columns")
        .attr(
          "transform",
          (d, i) =>
            `translate(${
            (i * (width - margin.left - margin.right)) / baseColors.length +
            margin.left
          },0)`
        );

      const yPos = (d, i) =>
        (i * (height - margin.top - margin.bottom)) / (nShades + 1) + margin.top;

      let columnWidth =
        (width - margin.left - margin.right) / baseColors.length - padding;
      let rectHeight = height / (nShades + 1) - padding;
      const rows = cols
        .selectAll("g")
        .data((column) => {
          // console.log(column)
          const color = d3.color(column.hex);
          const hsl = d3.hsl(color);
          const lightEnd = hsl.copy();
          lightEnd.l = 0.9;
          // lightEnd.s = lightEnd.s * 0.7;
          const darkEnd = hsl.copy();
          darkEnd.l = 0.1;
          // darkEnd.s = darkEnd.s * 1.1;
          // console.log(darkEnd.formatHex());
          const centerPoint = hsl.copy();
          centerPoint.l = 0.5;
          const colorScale = d3
            .scaleLinear()
            .domain([0, nShades / 2, nShades - 1])
            .range([
              lightEnd.formatHex(),
              centerPoint.formatHex(),
              darkEnd.formatHex(),
            ]);

          // const colorScale = d3
          //   .scaleLinear()
          //   .domain([-1, nShades / 2, nShades + 1])
          //   .range(['white', column.hex, 'black']);

          const colors = d3.range(nShades).map((d) => {
            //   const textColor = d3.hsl(colorScale(d));
            //   textColor.s = 0;
            //   textColor.l = 1-textColor.l
            return {
              // i: d,
              baseColor: column.hex,
              rgb: colorScale(d),
              lightness: `${(d + 1) * 10}%`,
              hex: d3.color(colorScale(d)).formatHex(),
              textColor: d3.hsl(colorScale(d)).l > 0.6 ? "#363636" : "#e6e6e6",
            };
          });

          colors.unshift({
            // i: hsl.l > 0.5 ? 0 : nShades,
            baseColor: "True",
            rgb: d3.color(column.hex).formatRgb(),
            hex: column.hex,
            lightness: "n/a",
            textColor: d3.hsl(column.hex).l > 0.5 ? "#363636" : "#e6e6e6",
          });
          return colors;
        })
        .join("g")
        .attr("class", "column-row")
        .attr("transform", (d, i) => `translate(0, ${yPos(d, i)})`);

      rows
        .selectAll("rect")
        .data((node) => [node])
        .join("rect")
        .attr("class", "color-square")
        .attr("width", columnWidth)
        .attr("height", rectHeight)
        .attr("stroke", "#c9c9c9")
        .attr("stroke-width", 0.5)
        .attr("y", 0)
        .attr("fill", (d) => d.rgb)
        .on("click", (event, d) => {
          console.log(d);
          navigator.clipboard.writeText(d.hex);

          tooltip.html(`${d.hex} <br>Copied to clipboard!`);
          tooltip
            .style("opacity", 1)
            .style("border", `1px solid black`)
            .style("color", d.textColor)
            .style("background-color", d.hex)
            .style("left", `${event.pageX}px`)
            .style("top", `${event.pageY}px`);

          tooltip.transition().duration(800).delay(10).style("opacity", 0);
        });

      rows
        .selectAll("text")
        .data((node) => [node])
        .join("text")
        .attr("class", "hex-label")
        .attr("fill", (d) => d.textColor)
        .attr("y", rectHeight - padding)
        .attr("x", padding)
        .text((d) => d.hex);
      selection
        .selectAll("line")
        .data([null])
        .join("line")
        .attr("y1", yPos(0, 1) - padding / 2)
        .attr("y2", yPos(0, 1) - padding / 2)
        .attr("x1", margin.left)
        .attr("x2", width - margin.right - padding)
        .attr("stroke-width", 1)
        .attr("stroke", "black");

      cols
        .selectAll(".column-label")
        .data((column) => [column])
        .join("text")
        .attr("class", "column-label label")
        .attr("x", columnWidth / 2)
        .attr("text-anchor", "middle")
        .attr("y", margin.top - 5)
        .text((d) => d.colorName);

      const labelScale = d3
        .scaleLinear()
        .domain([0, nShades - 1])
        .range([90, 10]);
      const rowLabels = d3
        .range(nShades)
        .map((d) => `${labelScale(d).toFixed(0)}%`);
      rowLabels.unshift("Base Colours");
      selection
        .selectAll(".row-label")
        .data(rowLabels)
        .join("text")
        .attr("x", margin.left - padding)
        .attr("class", "row-label label")
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("text-align", "middle")
        .attr("dy", "0.1em")
        .attr("y", (d, i) => yPos(d, i) + rectHeight / 2)
        .text((d) => d);
      // .call(wrap, 50);
      selection
        .selectAll(".lightness-label")
        .data([null])
        .join("text")
        .attr("class", "lightness-label label")
        .attr("x", 5)
        .attr("y", (height - margin.top - rectHeight) / 2 + rectHeight)
        .attr(
          "transform",
          `rotate(-90,${margin.left / 3},${
          (height - margin.top - rectHeight) / 2 + rectHeight
        }  )`
        )
        .text("Lightness");
    };

    my.baseColors = function (_) {
      return arguments.length ? ((baseColors = _), my) : baseColors;
    };
    my.margin = function (_) {
      return arguments.length ? ((margin = _), my) : margin;
    };
    my.padding = function (_) {
      return arguments.length ? ((padding = _), my) : padding;
    };
    my.nShades = function (_) {
      return arguments.length ? ((nShades = _), my) : nShades;
    };
    return my;
  };

  function serialize(svg) {
    const xmlns = "http://www.w3.org/2000/xmlns/";
    const xlinkns = "http://www.w3.org/1999/xlink";
    const svgns = "http://www.w3.org/2000/svg";
    svg = svg.cloneNode(true);
    const fragment = window.location.href + "#";
    const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      for (const attr of walker.currentNode.attributes) {
        if (attr.value.includes(fragment)) {
          attr.value = attr.value.replace(fragment, "#");
        }
      }
    }
    svg.setAttributeNS(xmlns, "xmlns", svgns);
    svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
    const serializer = new window.XMLSerializer();
    const string = serializer.serializeToString(svg);
    return new Blob([string], {
      type: "image/svg+xml",
    });
  }

  function getRequiredStyles(elem) {
    if (!elem) return []; // Element does not exist, empty list.
    const requiredStyles = [
      "font-family",
      "font-weight",
      "font-size",
      "transform-origin",
      "dy",
      "text-align",
      "dominant-baseline",
      "text-anchor",
    ]; // If the text styling is wrong, its possible a required styling is missing from here! Add it in.
    // console.log(elem);
    var win = document.defaultView || window,
      style,
      styleNode = [];
    if (win.getComputedStyle) {
      /* Modern browsers */
      style = win.getComputedStyle(elem, "");
      //console.log(style);
      for (var i = 0; i < requiredStyles.length; i++) {
        //console.log(requiredStyles[i]);
        styleNode.push(
          requiredStyles[i] + ":" + style.getPropertyValue(requiredStyles[i])
        );
        //               ^name ^           ^ value ^
      }
    } else if (elem.currentStyle) {
      /* IE */
      style = elem.currentStyle;
      console.log(style);
      for (var name in style) {
        styleNode.push(name + ":" + style[name]);
      }
    } else {
      /* Ancient browser..*/
      style = elem.style;
      console.log(style);
      for (var i = 0; i < style.length; i++) {
        styleNode.push(style[i] + ":" + style[style[i]]);
      }
    }
    return styleNode;
  }

  const addStyles = (chart) => {
    /* Function to add the styles from the CSS onto the computed SVG before saving it.
  // Currently only implemented to fix the font-size and font-family attributes for any text class. 
  // If these values are set within the d3 (i.e. directly onto the SVG), this is unnecessary
  // But it ensures that text styling using CSS is retained. */

    const textElements = chart.getElementsByTagName("text");
    // console.log(textElements);

    const mainStyles = getRequiredStyles(chart);
    // console.log(mainStyles);
    chart.style.cssText = mainStyles.join(";");
    Array.from(textElements).forEach(function (element) {
      // console.log(element);
      // console.log(element)
      const styles = getRequiredStyles(element);
      // console.log(styles)
      element.style.cssText = styles.join(";");
    });
    return chart;
  };

  const saveChart = (chartID) => {
    const chart = document.getElementById(chartID);
    // console.log(chart);
    //   console.log(getStyleById(chartID));
    if (chart === null) {
      alert(`error! ${chartID} cannot be found`);
      return -1;
    }

    const chartWithStyles = addStyles(chart);
    const chartBlob = serialize(chartWithStyles);
    const fileURL = URL.createObjectURL(chartBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = fileURL;
    downloadLink.download = `${chartID}.svg`;
    document.body.appendChild(downloadLink);

    downloadLink.click();
  };

  function getColorByHueRotation(originalColor, theta) {
    let complementObject = d3.hsl(originalColor);
    complementObject.h += theta;
    // console.log(complementObject);
    return {
      colorName: theta > 0 ? `+${theta}°` : `${theta}°`,
      hex: complementObject.formatHex(),
      colorObject: complementObject,
    };
  }

  const getHues = (originalHex, rotations) => {
    const originalColor = {
      colorName: "Original Colour",
      hex: originalHex,
    };

    originalColor["colorObject"] = d3.color(originalColor.hex);
    const baseColors = [];
    baseColors.push(originalColor);

    rotations.forEach((theta) => {
      baseColors.push(getColorByHueRotation(originalColor.colorObject, theta));
    });
    return baseColors;
  };

  const setDefaultColors = (colors) => {
    const rotations = [-30, 30, 120, 180, 240];
    const originalColorHex = "#afdef4";
    const defaultColors = getHues(originalColorHex, rotations);
    return defaultColors;
  };

  const rotationOptions = {
    default1: [-30, 30, 120, 180, 240],
    default2: [-60, 60, 150, 180, 210],
    analogous: [20, 40, 60, 80, 100, 120],
    divergent: [60, 120, 180, 240, 300],
    goldenRatio: [32.5, 52.5, 85.0, 137.5, 222.5],
    goldenRatio2: [-32.5, -52.5, -85.0, -137.5, -222.5],
  };
  function getColors(params) {
    let colors;
    if (params.get("hexInput") && params.get("rotation")) {
      let rotations;
      const hexInput = params.get("hexInput");
      if (!color$1(hexInput)) {
        alert(
          `Error - ${hexInput} is not a hex colour, please input a valid colour`
        );
        colors = setDefaultColors();
        return colors;
      }

      if (params.get("rotation") === "custom") {
        rotations = params
          .get("customRotation")
          .split(",")
          .map((d) => Number(d.trim()));
        if (!rotations | (rotations.length === 1)) {
          alert("Please enter hue values as a comma separated list");
          colors = setDefaultColors();
          return colors;
        }
      } else {
        rotations = rotationOptions[params.get("rotation")];
      }

      colors = getHues(hexInput, rotations);
    } else if (params.get("hexList")) {
      const hexListInput = params.get("hexList");

      let colorList = hexListInput.split(",").map((d) => d.trim());
      colorList.forEach((color) => {
        // console.log(d3.color(color))
        if (!color$1(color)) {
          alert(
            `Error! ${color} is not a valid colour hex code, please enter valid colours.`
          );
          colors = setDefaultColors();
          return colors;
        }
      });
      colors = colorList.map((d) => ({ hex: d }));
    } else {
      colors = setDefaultColors();
    }
    return colors;
  }

  const saveJson = () => {
    const palette = select("#palette-svg");
    const baseColors = palette
      .selectAll("rect")
      .data()
      .map((d) => ({
        baseColor: d.baseColor,
        rgb: d.rgb,
        hex: d.hex,
        lightness: d.lightness,
      }));

    const baseColorsJSON = JSON.stringify(baseColors,null, 2);

    const colorsBlob = new Blob([baseColorsJSON], { type: "application/json" });
    const fileURL = URL.createObjectURL(colorsBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = fileURL;
    downloadLink.download = `color-palette.json`;
    document.body.appendChild(downloadLink);

    downloadLink.click();
  };

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  var installedColorSpaces = [],
      undef = function (obj) {
          return typeof obj === 'undefined';
      },
      channelRegExp = /\s*(\.\d+|\d+(?:\.\d+)?)(%)?\s*/,
      percentageChannelRegExp = /\s*(\.\d+|100|\d?\d(?:\.\d+)?)%\s*/,
      alphaChannelRegExp = /\s*(\.\d+|\d+(?:\.\d+)?)\s*/,
      cssColorRegExp = new RegExp(
                           '^(rgb|hsl|hsv)a?' +
                           '\\(' +
                               channelRegExp.source + ',' +
                               channelRegExp.source + ',' +
                               channelRegExp.source +
                               '(?:,' + alphaChannelRegExp.source + ')?' +
                           '\\)$', 'i');

  function color(obj) {
      if (Array.isArray(obj)) {
          if (typeof obj[0] === 'string' && typeof color[obj[0]] === 'function') {
              // Assumed array from .toJSON()
              return new color[obj[0]](obj.slice(1, obj.length));
          } else if (obj.length === 4) {
              // Assumed 4 element int RGB array from canvas with all channels [0;255]
              return new color.RGB(obj[0] / 255, obj[1] / 255, obj[2] / 255, obj[3] / 255);
          }
      } else if (typeof obj === 'string') {
          var lowerCased = obj.toLowerCase();
          if (color.namedColors[lowerCased]) {
              obj = '#' + color.namedColors[lowerCased];
          }
          if (lowerCased === 'transparent') {
              obj = 'rgba(0,0,0,0)';
          }
          // Test for CSS rgb(....) string
          var matchCssSyntax = obj.match(cssColorRegExp);
          if (matchCssSyntax) {
              var colorSpaceName = matchCssSyntax[1].toUpperCase(),
                  alpha = undef(matchCssSyntax[8]) ? matchCssSyntax[8] : parseFloat(matchCssSyntax[8]),
                  hasHue = colorSpaceName[0] === 'H',
                  firstChannelDivisor = matchCssSyntax[3] ? 100 : (hasHue ? 360 : 255),
                  secondChannelDivisor = (matchCssSyntax[5] || hasHue) ? 100 : 255,
                  thirdChannelDivisor = (matchCssSyntax[7] || hasHue) ? 100 : 255;
              if (undef(color[colorSpaceName])) {
                  throw new Error('color.' + colorSpaceName + ' is not installed.');
              }
              return new color[colorSpaceName](
                  parseFloat(matchCssSyntax[2]) / firstChannelDivisor,
                  parseFloat(matchCssSyntax[4]) / secondChannelDivisor,
                  parseFloat(matchCssSyntax[6]) / thirdChannelDivisor,
                  alpha
              );
          }
          // Assume hex syntax
          if (obj.length < 6) {
              // Allow CSS shorthand
              obj = obj.replace(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i, '$1$1$2$2$3$3');
          }
          // Split obj into red, green, and blue components
          var hexMatch = obj.match(/^#?([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])$/i);
          if (hexMatch) {
              return new color.RGB(
                  parseInt(hexMatch[1], 16) / 255,
                  parseInt(hexMatch[2], 16) / 255,
                  parseInt(hexMatch[3], 16) / 255
              );
          }

          // No match so far. Lets try the less likely ones
          if (color.CMYK) {
              var cmykMatch = obj.match(new RegExp(
                               '^cmyk' +
                               '\\(' +
                                   percentageChannelRegExp.source + ',' +
                                   percentageChannelRegExp.source + ',' +
                                   percentageChannelRegExp.source + ',' +
                                   percentageChannelRegExp.source +
                               '\\)$', 'i'));
              if (cmykMatch) {
                  return new color.CMYK(
                      parseFloat(cmykMatch[1]) / 100,
                      parseFloat(cmykMatch[2]) / 100,
                      parseFloat(cmykMatch[3]) / 100,
                      parseFloat(cmykMatch[4]) / 100
                  );
              }
          }
      } else if (typeof obj === 'object' && obj.isColor) {
          return obj;
      }
      return false;
  }

  color.namedColors = {};

  color.installColorSpace = function (colorSpaceName, propertyNames, config) {
      color[colorSpaceName] = function (a1) { // ...
          var args = Array.isArray(a1) ? a1 : arguments;
          propertyNames.forEach(function (propertyName, i) {
              var propertyValue = args[i];
              if (propertyName === 'alpha') {
                  this._alpha = (isNaN(propertyValue) || propertyValue > 1) ? 1 : (propertyValue < 0 ? 0 : propertyValue);
              } else {
                  if (isNaN(propertyValue)) {
                      throw new Error('[' + colorSpaceName + ']: Invalid color: (' + propertyNames.join(',') + ')');
                  }
                  if (propertyName === 'hue') {
                      this._hue = propertyValue < 0 ? propertyValue - Math.floor(propertyValue) : propertyValue % 1;
                  } else {
                      this['_' + propertyName] = propertyValue < 0 ? 0 : (propertyValue > 1 ? 1 : propertyValue);
                  }
              }
          }, this);
      };
      color[colorSpaceName].propertyNames = propertyNames;

      var prototype = color[colorSpaceName].prototype;

      ['valueOf', 'hex', 'hexa', 'css', 'cssa'].forEach(function (methodName) {
          prototype[methodName] = prototype[methodName] || (colorSpaceName === 'RGB' ? prototype.hex : function () {
              return this.rgb()[methodName]();
          });
      });

      prototype.isColor = true;

      prototype.equals = function (otherColor, epsilon) {
          if (undef(epsilon)) {
              epsilon = 1e-10;
          }

          otherColor = otherColor[colorSpaceName.toLowerCase()]();

          for (var i = 0; i < propertyNames.length; i = i + 1) {
              if (Math.abs(this['_' + propertyNames[i]] - otherColor['_' + propertyNames[i]]) > epsilon) {
                  return false;
              }
          }

          return true;
      };

      prototype.toJSON = function () {
          return [colorSpaceName].concat(propertyNames.map(function (propertyName) {
              return this['_' + propertyName];
          }, this));
      };

      for (var propertyName in config) {
          if (config.hasOwnProperty(propertyName)) {
              var matchFromColorSpace = propertyName.match(/^from(.*)$/);
              if (matchFromColorSpace) {
                  color[matchFromColorSpace[1].toUpperCase()].prototype[colorSpaceName.toLowerCase()] = config[propertyName];
              } else {
                  prototype[propertyName] = config[propertyName];
              }
          }
      }

      // It is pretty easy to implement the conversion to the same color space:
      prototype[colorSpaceName.toLowerCase()] = function () {
          return this;
      };
      prototype.toString = function () {
          return '[' + colorSpaceName + ' ' + propertyNames.map(function (propertyName) {
              return this['_' + propertyName];
          }, this).join(', ') + ']';
      };

      // Generate getters and setters
      propertyNames.forEach(function (propertyName) {
          var shortName = propertyName === 'black' ? 'k' : propertyName.charAt(0);
          prototype[propertyName] = prototype[shortName] = function (value, isDelta) {
              // Simple getter mode: color.red()
              if (typeof value === 'undefined') {
                  return this['_' + propertyName];
              } else if (isDelta) {
                  // Adjuster: color.red(+.2, true)
                  return new this.constructor(propertyNames.map(function (otherPropertyName) {
                      return this['_' + otherPropertyName] + (propertyName === otherPropertyName ? value : 0);
                  }, this));
              } else {
                  // Setter: color.red(.2);
                  return new this.constructor(propertyNames.map(function (otherPropertyName) {
                      return (propertyName === otherPropertyName) ? value : this['_' + otherPropertyName];
                  }, this));
              }
          };
      });

      function installForeignMethods(targetColorSpaceName, sourceColorSpaceName) {
          var obj = {};
          obj[sourceColorSpaceName.toLowerCase()] = function () {
              return this.rgb()[sourceColorSpaceName.toLowerCase()]();
          };
          color[sourceColorSpaceName].propertyNames.forEach(function (propertyName) {
              var shortName = propertyName === 'black' ? 'k' : propertyName.charAt(0);
              obj[propertyName] = obj[shortName] = function (value, isDelta) {
                  return this[sourceColorSpaceName.toLowerCase()]()[propertyName](value, isDelta);
              };
          });
          for (var prop in obj) {
              if (obj.hasOwnProperty(prop) && color[targetColorSpaceName].prototype[prop] === undefined) {
                  color[targetColorSpaceName].prototype[prop] = obj[prop];
              }
          }
      }

      installedColorSpaces.forEach(function (otherColorSpaceName) {
          installForeignMethods(colorSpaceName, otherColorSpaceName);
          installForeignMethods(otherColorSpaceName, colorSpaceName);
      });

      installedColorSpaces.push(colorSpaceName);
      return color;
  };

  color.pluginList = [];

  color.use = function (plugin) {
      if (color.pluginList.indexOf(plugin) === -1) {
          this.pluginList.push(plugin);
          plugin(color);
      }
      return color;
  };

  color.installMethod = function (name, fn) {
      installedColorSpaces.forEach(function (colorSpace) {
          color[colorSpace].prototype[name] = fn;
      });
      return this;
  };

  color.installColorSpace('RGB', ['red', 'green', 'blue', 'alpha'], {
      hex: function () {
          var hexString = (Math.round(255 * this._red) * 0x10000 + Math.round(255 * this._green) * 0x100 + Math.round(255 * this._blue)).toString(16);
          return '#' + ('00000'.substr(0, 6 - hexString.length)) + hexString;
      },

      hexa: function () {
          var alphaString = Math.round(this._alpha * 255).toString(16);
          return '#' + '00'.substr(0, 2 - alphaString.length) + alphaString + this.hex().substr(1, 6);
      },

      css: function () {
          return 'rgb(' + Math.round(255 * this._red) + ',' + Math.round(255 * this._green) + ',' + Math.round(255 * this._blue) + ')';
      },

      cssa: function () {
          return 'rgba(' + Math.round(255 * this._red) + ',' + Math.round(255 * this._green) + ',' + Math.round(255 * this._blue) + ',' + this._alpha + ')';
      }
  });

  var color_1 = color;

  var XYZ = function XYZ(color) {
      color.installColorSpace('XYZ', ['x', 'y', 'z', 'alpha'], {
          fromRgb: function () {
              // http://www.easyrgb.com/index.php?X=MATH&H=02#text2
              var convert = function (channel) {
                      return channel > 0.04045 ?
                          Math.pow((channel + 0.055) / 1.055, 2.4) :
                          channel / 12.92;
                  },
                  r = convert(this._red),
                  g = convert(this._green),
                  b = convert(this._blue);

              // Reference white point sRGB D65:
              // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
              return new color.XYZ(
                  r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
                  r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
                  r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
                  this._alpha
              );
          },

          rgb: function () {
              // http://www.easyrgb.com/index.php?X=MATH&H=01#text1
              var x = this._x,
                  y = this._y,
                  z = this._z,
                  convert = function (channel) {
                      return channel > 0.0031308 ?
                          1.055 * Math.pow(channel, 1 / 2.4) - 0.055 :
                          12.92 * channel;
                  };

              // Reference white point sRGB D65:
              // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
              return new color.RGB(
                  convert(x *  3.2404542 + y * -1.5371385 + z * -0.4985314),
                  convert(x * -0.9692660 + y *  1.8760108 + z *  0.0415560),
                  convert(x *  0.0556434 + y * -0.2040259 + z *  1.0572252),
                  this._alpha
              );
          },

          lab: function () {
              // http://www.easyrgb.com/index.php?X=MATH&H=07#text7
              var convert = function (channel) {
                      return channel > 0.008856 ?
                          Math.pow(channel, 1 / 3) :
                          7.787037 * channel + 4 / 29;
                  },
                  x = convert(this._x /  95.047),
                  y = convert(this._y / 100.000),
                  z = convert(this._z / 108.883);

              return new color.LAB(
                  (116 * y) - 16,
                  500 * (x - y),
                  200 * (y - z),
                  this._alpha
              );
          }
      });
  };

  var LAB = function LAB(color) {
      color.use(XYZ);

      color.installColorSpace('LAB', ['l', 'a', 'b', 'alpha'], {
          fromRgb: function () {
              return this.xyz().lab();
          },

          rgb: function () {
              return this.xyz().rgb();
          },

          xyz: function () {
              // http://www.easyrgb.com/index.php?X=MATH&H=08#text8
              var convert = function (channel) {
                      var pow = Math.pow(channel, 3);
                      return pow > 0.008856 ?
                          pow :
                          (channel - 16 / 116) / 7.87;
                  },
                  y = (this._l + 16) / 116,
                  x = this._a / 500 + y,
                  z = y - this._b / 200;

              return new color.XYZ(
                  convert(x) *  95.047,
                  convert(y) * 100.000,
                  convert(z) * 108.883,
                  this._alpha
              );
          }
      });
  };

  var HSV = function HSV(color) {
      color.installColorSpace('HSV', ['hue', 'saturation', 'value', 'alpha'], {
          rgb: function () {
              var hue = this._hue,
                  saturation = this._saturation,
                  value = this._value,
                  i = Math.min(5, Math.floor(hue * 6)),
                  f = hue * 6 - i,
                  p = value * (1 - saturation),
                  q = value * (1 - f * saturation),
                  t = value * (1 - (1 - f) * saturation),
                  red,
                  green,
                  blue;
              switch (i) {
              case 0:
                  red = value;
                  green = t;
                  blue = p;
                  break;
              case 1:
                  red = q;
                  green = value;
                  blue = p;
                  break;
              case 2:
                  red = p;
                  green = value;
                  blue = t;
                  break;
              case 3:
                  red = p;
                  green = q;
                  blue = value;
                  break;
              case 4:
                  red = t;
                  green = p;
                  blue = value;
                  break;
              case 5:
                  red = value;
                  green = p;
                  blue = q;
                  break;
              }
              return new color.RGB(red, green, blue, this._alpha);
          },

          hsl: function () {
              var l = (2 - this._saturation) * this._value,
                  sv = this._saturation * this._value,
                  svDivisor = l <= 1 ? l : (2 - l),
                  saturation;

              // Avoid division by zero when lightness approaches zero:
              if (svDivisor < 1e-9) {
                  saturation = 0;
              } else {
                  saturation = sv / svDivisor;
              }
              return new color.HSL(this._hue, saturation, l / 2, this._alpha);
          },

          fromRgb: function () { // Becomes one.color.RGB.prototype.hsv
              var red = this._red,
                  green = this._green,
                  blue = this._blue,
                  max = Math.max(red, green, blue),
                  min = Math.min(red, green, blue),
                  delta = max - min,
                  hue,
                  saturation = (max === 0) ? 0 : (delta / max),
                  value = max;
              if (delta === 0) {
                  hue = 0;
              } else {
                  switch (max) {
                  case red:
                      hue = (green - blue) / delta / 6 + (green < blue ? 1 : 0);
                      break;
                  case green:
                      hue = (blue - red) / delta / 6 + 1 / 3;
                      break;
                  case blue:
                      hue = (red - green) / delta / 6 + 2 / 3;
                      break;
                  }
              }
              return new color.HSV(hue, saturation, value, this._alpha);
          }
      });
  };

  var HSL = function HSL(color) {
      color.use(HSV);

      color.installColorSpace('HSL', ['hue', 'saturation', 'lightness', 'alpha'], {
          hsv: function () {
              // Algorithm adapted from http://wiki.secondlife.com/wiki/Color_conversion_scripts
              var l = this._lightness * 2,
                  s = this._saturation * ((l <= 1) ? l : 2 - l),
                  saturation;

              // Avoid division by zero when l + s is very small (approaching black):
              if (l + s < 1e-9) {
                  saturation = 0;
              } else {
                  saturation = (2 * s) / (l + s);
              }

              return new color.HSV(this._hue, saturation, (l + s) / 2, this._alpha);
          },

          rgb: function () {
              return this.hsv().rgb();
          },

          fromRgb: function () { // Becomes one.color.RGB.prototype.hsv
              return this.hsv().hsl();
          }
      });
  };

  var CMYK = function CMYK(color) {
      color.installColorSpace('CMYK', ['cyan', 'magenta', 'yellow', 'black', 'alpha'], {
          rgb: function () {
              return new color.RGB((1 - this._cyan * (1 - this._black) - this._black),
                                       (1 - this._magenta * (1 - this._black) - this._black),
                                       (1 - this._yellow * (1 - this._black) - this._black),
                                       this._alpha);
          },

          fromRgb: function () { // Becomes one.color.RGB.prototype.cmyk
              // Adapted from http://www.javascripter.net/faq/rgb2cmyk.htm
              var red = this._red,
                  green = this._green,
                  blue = this._blue,
                  cyan = 1 - red,
                  magenta = 1 - green,
                  yellow = 1 - blue,
                  black = 1;
              if (red || green || blue) {
                  black = Math.min(cyan, Math.min(magenta, yellow));
                  cyan = (cyan - black) / (1 - black);
                  magenta = (magenta - black) / (1 - black);
                  yellow = (yellow - black) / (1 - black);
              } else {
                  black = 1;
              }
              return new color.CMYK(cyan, magenta, yellow, black, this._alpha);
          }
      });
  };

  var namedColors = function namedColors(color) {
      color.namedColors = {
          aliceblue: 'f0f8ff',
          antiquewhite: 'faebd7',
          aqua: '0ff',
          aquamarine: '7fffd4',
          azure: 'f0ffff',
          beige: 'f5f5dc',
          bisque: 'ffe4c4',
          black: '000',
          blanchedalmond: 'ffebcd',
          blue: '00f',
          blueviolet: '8a2be2',
          brown: 'a52a2a',
          burlywood: 'deb887',
          cadetblue: '5f9ea0',
          chartreuse: '7fff00',
          chocolate: 'd2691e',
          coral: 'ff7f50',
          cornflowerblue: '6495ed',
          cornsilk: 'fff8dc',
          crimson: 'dc143c',
          cyan: '0ff',
          darkblue: '00008b',
          darkcyan: '008b8b',
          darkgoldenrod: 'b8860b',
          darkgray: 'a9a9a9',
          darkgrey: 'a9a9a9',
          darkgreen: '006400',
          darkkhaki: 'bdb76b',
          darkmagenta: '8b008b',
          darkolivegreen: '556b2f',
          darkorange: 'ff8c00',
          darkorchid: '9932cc',
          darkred: '8b0000',
          darksalmon: 'e9967a',
          darkseagreen: '8fbc8f',
          darkslateblue: '483d8b',
          darkslategray: '2f4f4f',
          darkslategrey: '2f4f4f',
          darkturquoise: '00ced1',
          darkviolet: '9400d3',
          deeppink: 'ff1493',
          deepskyblue: '00bfff',
          dimgray: '696969',
          dimgrey: '696969',
          dodgerblue: '1e90ff',
          firebrick: 'b22222',
          floralwhite: 'fffaf0',
          forestgreen: '228b22',
          fuchsia: 'f0f',
          gainsboro: 'dcdcdc',
          ghostwhite: 'f8f8ff',
          gold: 'ffd700',
          goldenrod: 'daa520',
          gray: '808080',
          grey: '808080',
          green: '008000',
          greenyellow: 'adff2f',
          honeydew: 'f0fff0',
          hotpink: 'ff69b4',
          indianred: 'cd5c5c',
          indigo: '4b0082',
          ivory: 'fffff0',
          khaki: 'f0e68c',
          lavender: 'e6e6fa',
          lavenderblush: 'fff0f5',
          lawngreen: '7cfc00',
          lemonchiffon: 'fffacd',
          lightblue: 'add8e6',
          lightcoral: 'f08080',
          lightcyan: 'e0ffff',
          lightgoldenrodyellow: 'fafad2',
          lightgray: 'd3d3d3',
          lightgrey: 'd3d3d3',
          lightgreen: '90ee90',
          lightpink: 'ffb6c1',
          lightsalmon: 'ffa07a',
          lightseagreen: '20b2aa',
          lightskyblue: '87cefa',
          lightslategray: '789',
          lightslategrey: '789',
          lightsteelblue: 'b0c4de',
          lightyellow: 'ffffe0',
          lime: '0f0',
          limegreen: '32cd32',
          linen: 'faf0e6',
          magenta: 'f0f',
          maroon: '800000',
          mediumaquamarine: '66cdaa',
          mediumblue: '0000cd',
          mediumorchid: 'ba55d3',
          mediumpurple: '9370d8',
          mediumseagreen: '3cb371',
          mediumslateblue: '7b68ee',
          mediumspringgreen: '00fa9a',
          mediumturquoise: '48d1cc',
          mediumvioletred: 'c71585',
          midnightblue: '191970',
          mintcream: 'f5fffa',
          mistyrose: 'ffe4e1',
          moccasin: 'ffe4b5',
          navajowhite: 'ffdead',
          navy: '000080',
          oldlace: 'fdf5e6',
          olive: '808000',
          olivedrab: '6b8e23',
          orange: 'ffa500',
          orangered: 'ff4500',
          orchid: 'da70d6',
          palegoldenrod: 'eee8aa',
          palegreen: '98fb98',
          paleturquoise: 'afeeee',
          palevioletred: 'd87093',
          papayawhip: 'ffefd5',
          peachpuff: 'ffdab9',
          peru: 'cd853f',
          pink: 'ffc0cb',
          plum: 'dda0dd',
          powderblue: 'b0e0e6',
          purple: '800080',
          rebeccapurple: '639',
          red: 'f00',
          rosybrown: 'bc8f8f',
          royalblue: '4169e1',
          saddlebrown: '8b4513',
          salmon: 'fa8072',
          sandybrown: 'f4a460',
          seagreen: '2e8b57',
          seashell: 'fff5ee',
          sienna: 'a0522d',
          silver: 'c0c0c0',
          skyblue: '87ceeb',
          slateblue: '6a5acd',
          slategray: '708090',
          slategrey: '708090',
          snow: 'fffafa',
          springgreen: '00ff7f',
          steelblue: '4682b4',
          tan: 'd2b48c',
          teal: '008080',
          thistle: 'd8bfd8',
          tomato: 'ff6347',
          turquoise: '40e0d0',
          violet: 'ee82ee',
          wheat: 'f5deb3',
          white: 'fff',
          whitesmoke: 'f5f5f5',
          yellow: 'ff0',
          yellowgreen: '9acd32'
      };
  };

  var clearer = function clearer(color) {
      color.installMethod('clearer', function (amount) {
          return this.alpha(isNaN(amount) ? -0.1 : -amount, true);
      });
  };

  var luminance = function luminance(color) {
    // http://www.w3.org/TR/WCAG20/#relativeluminancedef

    function channelLuminance(value) {
      return (value <= 0.03928) ? value / 12.92 : Math.pow(((value + 0.055) / 1.055), 2.4);
    }

    color.installMethod('luminance', function () {
      var rgb = this.rgb();
      return 0.2126 * channelLuminance(rgb._red) + 0.7152 * channelLuminance(rgb._green) + 0.0722 * channelLuminance(rgb._blue);
    });
  };

  var contrast = function contrast(color) {
    // http://www.w3.org/TR/WCAG20/#contrast-ratiodef

    color.use(luminance);

    color.installMethod('contrast', function (color2) {
      var lum1 = this.luminance();
      var lum2 = color2.luminance();
      if (lum1 > lum2) {
        return (lum1 + 0.05) / (lum2 + 0.05);
      }

      return (lum2 + 0.05) / (lum1 + 0.05);
    });
  };

  var darken = function darken(color) {
      color.use(HSL);

      color.installMethod('darken', function (amount) {
          return this.lightness(isNaN(amount) ? -0.1 : -amount, true);
      });
  };

  var desaturate = function desaturate(color) {
      color.use(HSL);

      color.installMethod('desaturate', function (amount) {
          return this.saturation(isNaN(amount) ? -0.1 : -amount, true);
      });
  };

  var grayscale = function grayscale(color) {
      function gs () {
          /*jslint strict:false*/
          var rgb = this.rgb(),
              val = rgb._red * 0.3 + rgb._green * 0.59 + rgb._blue * 0.11;

          return new color.RGB(val, val, val, rgb._alpha);
      }

      color.installMethod('greyscale', gs).installMethod('grayscale', gs);
  };

  var isDark = function isDark(color) {

    color.installMethod('isDark', function () {
      var rgb = this.rgb();

      // YIQ equation from http://24ways.org/2010/calculating-color-contrast
      var yiq = (rgb._red * 255 * 299 + rgb._green * 255 * 587 + rgb._blue * 255 * 114) / 1000;
      return yiq < 128;
    });
  };

  var isLight = function isLight(color) {

    color.use(isDark);

    color.installMethod('isLight', function () {
      return !this.isDark();
    });
  };

  var lighten = function lighten(color) {
      color.use(HSL);

      color.installMethod('lighten', function (amount) {
          return this.lightness(isNaN(amount) ? 0.1 : amount, true);
      });
  };

  var mix = function mix(color) {
      color.installMethod('mix', function (otherColor, weight) {
          otherColor = color(otherColor).rgb();
          weight = 1 - (isNaN(weight) ? 0.5 : weight);

          var w = weight * 2 - 1,
              a = this._alpha - otherColor._alpha,
              weight1 = (((w * a === -1) ? w : (w + a) / (1 + w * a)) + 1) / 2,
              weight2 = 1 - weight1,
              rgb = this.rgb();

          return new color.RGB(
              rgb._red * weight1 + otherColor._red * weight2,
              rgb._green * weight1 + otherColor._green * weight2,
              rgb._blue * weight1 + otherColor._blue * weight2,
              rgb._alpha * weight + otherColor._alpha * (1 - weight)
          );
      });
  };

  var negate = function negate(color) {
      color.installMethod('negate', function () {
          var rgb = this.rgb();
          return new color.RGB(1 - rgb._red, 1 - rgb._green, 1 - rgb._blue, this._alpha);
      });
  };

  var opaquer = function opaquer(color) {
      color.installMethod('opaquer', function (amount) {
          return this.alpha(isNaN(amount) ? 0.1 : amount, true);
      });
  };

  var rotate = function rotate(color) {
      color.use(HSL);

      color.installMethod('rotate', function (degrees) {
          return this.hue((degrees || 0) / 360, true);
      });
  };

  var saturate = function saturate(color) {
      color.use(HSL);

      color.installMethod('saturate', function (amount) {
          return this.saturation(isNaN(amount) ? 0.1 : amount, true);
      });
  };

  // Adapted from http://gimp.sourcearchive.com/documentation/2.6.6-1ubuntu1/color-to-alpha_8c-source.html
  // toAlpha returns a color where the values of the argument have been converted to alpha
  var toAlpha = function toAlpha(color) {
      color.installMethod('toAlpha', function (color) {
          var me = this.rgb(),
              other = color(color).rgb(),
              epsilon = 1e-10,
              a = new color.RGB(0, 0, 0, me._alpha),
              channels = ['_red', '_green', '_blue'];

          channels.forEach(function (channel) {
              if (me[channel] < epsilon) {
                  a[channel] = me[channel];
              } else if (me[channel] > other[channel]) {
                  a[channel] = (me[channel] - other[channel]) / (1 - other[channel]);
              } else if (me[channel] > other[channel]) {
                  a[channel] = (other[channel] - me[channel]) / other[channel];
              } else {
                  a[channel] = 0;
              }
          });

          if (a._red > a._green) {
              if (a._red > a._blue) {
                  me._alpha = a._red;
              } else {
                  me._alpha = a._blue;
              }
          } else if (a._green > a._blue) {
              me._alpha = a._green;
          } else {
              me._alpha = a._blue;
          }

          if (me._alpha < epsilon) {
              return me;
          }

          channels.forEach(function (channel) {
              me[channel] = (me[channel] - other[channel]) / me._alpha + other[channel];
          });
          me._alpha *= a._alpha;

          return me;
      });
  };

  var onecolor = color_1
      .use(XYZ)
      .use(LAB)
      .use(HSV)
      .use(HSL)
      .use(CMYK)

      // Convenience functions
      .use(namedColors)
      .use(clearer)
      .use(contrast)
      .use(darken)
      .use(desaturate)
      .use(grayscale)
      .use(isDark)
      .use(isLight)
      .use(lighten)
      .use(luminance)
      .use(mix)
      .use(negate)
      .use(opaquer)
      .use(rotate)
      .use(saturate)
      .use(toAlpha);

  /*
   * color-blind
   * https://github.com/skratchdot/color-blind
   *
   * This source was copied from http://mudcu.be/sphere/js/Color.Blind.js
   *
   * It contains modifications for use in node.js.
   *
   * The original copyright is included below.
   *
   * Here is a license note copied/edited from (http://colorlab.wickline.org/colorblind/colorlab/engine.js)
   *
   *  20221013 UPDATE
   *      HCIRN appears to no longer exist. This makes it impractical
   *      for users to obtain permission from HCIRN in order to use
   *      this file for commercial works. Instead:
   *
   *      This work is licensed under a
   *      Creative Commons Attribution-ShareAlike 4.0 International License.
   *      http://creativecommons.org/licenses/by-sa/4.0/
   */
  var gammaCorrection = 2.2;
  var matrixXyzRgb = [
  	3.240712470389558, -0.969259258688888, 0.05563600315398933,
  	-1.5372626602963142, 1.875996969313966, -0.2039948802843549,
  	-0.49857440415943116, 0.041556132211625726, 1.0570636917433989
  ];
  var matrixRgbXyz = [
  	0.41242371206635076, 0.21265606784927693, 0.019331987577444885,
  	0.3575793401363035, 0.715157818248362, 0.11919267420354762,
  	0.1804662232369621, 0.0721864539171564, 0.9504491124870351
  ];
  // xy: coordinates, m: slope, yi: y-intercept
  var blinder = {
  	protan: {
  		x: 0.7465,
  		y: 0.2535,
  		m: 1.273463,
  		yi: -0.073894
  	},
  	deutan: {
  		x: 1.4,
  		y: -0.4,
  		m: 0.968437,
  		yi: 0.003331
  	},
  	tritan: {
  		x: 0.1748,
  		y: 0,
  		m: 0.062921,
  		yi: 0.292119
  	},
  	custom: {
  		x: 0.735,
  		y: 0.265,
  		m: -1.059259,
  		yi: 1.026914
  	}
  };

  var convertRgbToXyz = function (o) {
  	var M = matrixRgbXyz;
  	var z = {};
  	var R = o.R / 255;
  	var G = o.G / 255;
  	var B = o.B / 255;
  	{
  		R = (R > 0.04045) ? Math.pow(((R + 0.055) / 1.055), 2.4) : R / 12.92;
  		G = (G > 0.04045) ? Math.pow(((G + 0.055) / 1.055), 2.4) : G / 12.92;
  		B = (B > 0.04045) ? Math.pow(((B + 0.055) / 1.055), 2.4) : B / 12.92;
  	}
  	z.X = R * M[0] + G * M[3] + B * M[6];
  	z.Y = R * M[1] + G * M[4] + B * M[7];
  	z.Z = R * M[2] + G * M[5] + B * M[8];
  	return z;
  };

  var convertXyzToXyy = function (o) {
  	var n = o.X + o.Y + o.Z;
  	if (n === 0) {
  		return {x: 0, y: 0, Y: o.Y};
  	}
  	return {x: o.X / n, y: o.Y / n, Y: o.Y};
  };

  var Blind = function (rgb, type, anomalize) {
  	var z, v, n,
  		line, c, slope,
  		yi, dx, dy,
  		dX, dY, dZ,
  		dR, dG, dB,
  		_r, _g, _b,
  		ngx, ngz, M,
  		adjust;
  	if (type === "achroma") { // D65 in sRGB
  		z = rgb.R * 0.212656 + rgb.G * 0.715158 + rgb.B * 0.072186;
  		z = {R: z, G: z, B: z};
  		if (anomalize) {
  			v = 1.75;
  			n = v + 1;
  			z.R = (v * z.R + rgb.R) / n;
  			z.G = (v * z.G + rgb.G) / n;
  			z.B = (v * z.B + rgb.B) / n;
  		}
  		return z;
  	}
  	line = blinder[type];
  	c = convertXyzToXyy(convertRgbToXyz(rgb));
  	// The confusion line is between the source color and the confusion point
  	slope = (c.y - line.y) / (c.x - line.x);
  	yi = c.y - c.x * slope; // slope, and y-intercept (at x=0)
  	// Find the change in the x and y dimensions (no Y change)
  	dx = (line.yi - yi) / (slope - line.m);
  	dy = (slope * dx) + yi;
  	dY = 0;
  	// Find the simulated colors XYZ coords
  	z = {};
  	z.X = dx * c.Y / dy;
  	z.Y = c.Y;
  	z.Z = (1 - (dx + dy)) * c.Y / dy;
  	// Calculate difference between sim color and neutral color
  	ngx = 0.312713 * c.Y / 0.329016; // find neutral grey using D65 white-point
  	ngz = 0.358271 * c.Y / 0.329016;
  	dX = ngx - z.X;
  	dZ = ngz - z.Z;
  	// find out how much to shift sim color toward neutral to fit in RGB space
  	M = matrixXyzRgb;
  	dR = dX * M[0] + dY * M[3] + dZ * M[6]; // convert d to linear RGB
  	dG = dX * M[1] + dY * M[4] + dZ * M[7];
  	dB = dX * M[2] + dY * M[5] + dZ * M[8];
  	z.R = z.X * M[0] + z.Y * M[3] + z.Z * M[6]; // convert z to linear RGB
  	z.G = z.X * M[1] + z.Y * M[4] + z.Z * M[7];
  	z.B = z.X * M[2] + z.Y * M[5] + z.Z * M[8];
  	_r = ((z.R < 0 ? 0 : 1) - z.R) / dR;
  	_g = ((z.G < 0 ? 0 : 1) - z.G) / dG;
  	_b = ((z.B < 0 ? 0 : 1) - z.B) / dB;
  	_r = (_r > 1 || _r < 0) ? 0 : _r;
  	_g = (_g > 1 || _g < 0) ? 0 : _g;
  	_b = (_b > 1 || _b < 0) ? 0 : _b;
  	adjust = _r > _g ? _r : _g;
  	if (_b > adjust) {
  		adjust = _b;
  	}
  	// shift proportionally...
  	z.R += adjust * dR;
  	z.G += adjust * dG;
  	z.B += adjust * dB;
  	// apply gamma and clamp simulated color...
  	z.R = 255 * (z.R <= 0 ? 0 : z.R >= 1 ? 1 : Math.pow(z.R, 1 / gammaCorrection));
  	z.G = 255 * (z.G <= 0 ? 0 : z.G >= 1 ? 1 : Math.pow(z.G, 1 / gammaCorrection));
  	z.B = 255 * (z.B <= 0 ? 0 : z.B >= 1 ? 1 : Math.pow(z.B, 1 / gammaCorrection));
  	//
  	if (anomalize) {
  		v = 1.75;
  		n = v + 1;
  		z.R = (v * z.R + rgb.R) / n;
  		z.G = (v * z.G + rgb.G) / n;
  		z.B = (v * z.B + rgb.B) / n;
  	}
  	//
  	return z;
  };

  var blind = {
  	Blind: Blind
  };

  /*
   * color-blind
   * https://github.com/skratchdot/color-blind
   *
   * see blind.js for more information about the original source.
   *
   * Copyright (c) 2014 skratchdot
   * Licensed under the MIT license.
   */

  var colorBlind = createCommonjsModule(function (module, exports) {


  var Blind = blind.Blind;
  var colorVisionData = {
  	protanomaly: {type: "protan", anomalize: true},
  	protanopia: {type: "protan"},
  	deuteranomaly: {type: "deutan", anomalize: true},
  	deuteranopia: {type: "deutan"},
  	tritanomaly: {type: "tritan", anomalize: true},
  	tritanopia: {type: "tritan"},
  	achromatomaly: {type: "achroma", anomalize: true},
  	achromatopsia: {type: "achroma"}
  };
  var denorm = function (ratio) {
  	return Math.round(ratio * 255);
  };
  var createBlinder = function (key) {
  	return function (colorString, returnRgb) {
  		var color = onecolor(colorString);
  		if (!color) {
  			return returnRgb ? {R:0,G:0,B:0} : '#000000';
  		}
  		var rgb = new Blind({
  			R: denorm(color.red() || 0),
  			G: denorm(color.green() || 0),
  			B: denorm(color.blue() || 0)
  		}, colorVisionData[key].type, colorVisionData[key].anomalize);
  		// blinder.tritanomaly('#000000') causes NaN / null
  		rgb.R = rgb.R || 0;
  		rgb.G = rgb.G || 0;
  		rgb.B = rgb.B || 0;
  		if (returnRgb) {
  			delete rgb.X;
  			delete rgb.Y;
  			delete rgb.Z;
  			return rgb;
  		}
  		return new onecolor.RGB(
  			(rgb.R % 256) / 255,
  			(rgb.G % 256) / 255,
  			(rgb.B % 256) / 255,
  			1
  		).hex();
  	};
  };

  // add our exported functions
  for (var key in colorVisionData) {
  	exports[key] = createBlinder(key);
  }
  });

  // import { blinder } from "color-blinder";
  //Set all the save button functions
  window.saveChart = saveChart;
  window.saveJson = saveJson;

  window.colorBlindCheck = (cbType) => {
    // const cbDiv = d3.select("body").append("div").attr("class", "palette");
    let getCBColor;
    if (cbType === "deuteranomaly") {
      getCBColor = (hex) => colorBlind.deuteranomaly(hex);
    } else if (cbType === "protanomaly") {
      getCBColor = (hex) => colorBlind.protanomaly(hex);
    } else if (cbType === "protanopia") {
      getCBColor = (hex) => colorBlind.protanopia(hex);
    } else if (cbType === "deuteranopia") {
      getCBColor = (hex) => colorBlind.deuteranopia(hex);
    }
    const cbDiv = select("#cb-chart");

    let cbSvg;
    cbSvg = cbDiv.select("svg");
    //   console.log(cbSvg.node());

    if (!cbSvg.node()) {
      cbSvg = cbDiv
        .append("svg")
        .attr("id", "colorBlindPalette-svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("width", "100%")
        .attr("height", "100%");
    }

    //   console.log(blinder.protanomaly("#42dead"))

    let params1 = new URLSearchParams(window.location.search);
    const newColors = getColors(params1);
    const cbColors = newColors.map((d) => {
      // const rgb = d3.rgb(d.hex);
      // const cb = simulate(rgb, cbType);
      // const newColor = d3.color(`rgb(${cb.r}, ${cb.g}, ${cb.b})`).formatHex();
      // d.hex = blinder.protanomaly(d.hex);
      d.hex = getCBColor(d.hex);
      return d;
    });
    console.log(colors, cbColors);
    const cbPalette = colorPalette().baseColors(cbColors);
    cbSvg.call(cbPalette);
  };

  // Get current parameters
  const params = new URLSearchParams(window.location.search);

  //Set current state of input parameters:
  document.getElementById("hex-input").value = params.get("hexInput");
  params.get("rotation")
    ? (document.getElementById(params.get("rotation")).checked = true)
    : console.log(params.get("rotation"));
  document.getElementById("hex-list").value = params.get("hexList");
  params.get("rotation") === "custom"
    ? (document.getElementById("custom-rotation").value =
        params.get("customRotation"))
    : null;

  // Create the list of colours
  const colors = getColors(params);

  // Append the svg
  const svg = select("#palette")
    .append("svg")
    .attr("id", "palette-svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("width", "100%")
    .attr("height", "100%");

  // Create the image with the palette object
  const palette = colorPalette().baseColors(colors);
  svg.call(palette);

})();
//# sourceMappingURL=bundle.js.map
