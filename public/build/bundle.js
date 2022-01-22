
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/ContactCard.svelte generated by Svelte v3.46.2 */

    const file$2 = "src/ContactCard.svelte";

    function create_fragment$2(ctx) {
    	let div3;
    	let header;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h1;
    	let t1;
    	let t2;
    	let h2;
    	let t3;
    	let t4;
    	let div2;
    	let p;
    	let t5;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			header = element("header");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			t1 = text(/*userName*/ ctx[0]);
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(/*jobTitle*/ ctx[1]);
    			t4 = space();
    			div2 = element("div");
    			p = element("p");
    			t5 = text(/*description*/ ctx[2]);
    			if (!src_url_equal(img.src, img_src_value = /*userImage*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*userName*/ ctx[0]);
    			attr_dev(img, "class", "svelte-p7z0xn");
    			add_location(img, file$2, 71, 6, 1148);
    			attr_dev(div0, "class", "thumb svelte-p7z0xn");
    			toggle_class(div0, "thumb-placeholder", !/*userImage*/ ctx[3]);
    			add_location(div0, file$2, 70, 4, 1083);
    			attr_dev(h1, "class", "svelte-p7z0xn");
    			add_location(h1, file$2, 74, 6, 1232);
    			attr_dev(h2, "class", "svelte-p7z0xn");
    			add_location(h2, file$2, 76, 6, 1309);
    			attr_dev(div1, "class", "user-data svelte-p7z0xn");
    			add_location(div1, file$2, 73, 4, 1202);
    			attr_dev(header, "class", "svelte-p7z0xn");
    			add_location(header, file$2, 69, 2, 1070);
    			add_location(p, file$2, 80, 4, 1384);
    			attr_dev(div2, "class", "description svelte-p7z0xn");
    			add_location(div2, file$2, 79, 2, 1354);
    			attr_dev(div3, "class", "contact-card svelte-p7z0xn");
    			add_location(div3, file$2, 68, 0, 1041);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, header);
    			append_dev(header, div0);
    			append_dev(div0, img);
    			append_dev(header, t0);
    			append_dev(header, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, h2);
    			append_dev(h2, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, p);
    			append_dev(p, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userImage*/ 8 && !src_url_equal(img.src, img_src_value = /*userImage*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*userName*/ 1) {
    				attr_dev(img, "alt", /*userName*/ ctx[0]);
    			}

    			if (dirty & /*userImage*/ 8) {
    				toggle_class(div0, "thumb-placeholder", !/*userImage*/ ctx[3]);
    			}

    			if (dirty & /*userName*/ 1) set_data_dev(t1, /*userName*/ ctx[0]);
    			if (dirty & /*jobTitle*/ 2) set_data_dev(t3, /*jobTitle*/ ctx[1]);
    			if (dirty & /*description*/ 4) set_data_dev(t5, /*description*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ContactCard', slots, []);
    	let { userName } = $$props;
    	let { jobTitle } = $$props;
    	let { description } = $$props;
    	let { userImage } = $$props;
    	const initialName = userName;
    	const writable_props = ['userName', 'jobTitle', 'description', 'userImage'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ContactCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('userName' in $$props) $$invalidate(0, userName = $$props.userName);
    		if ('jobTitle' in $$props) $$invalidate(1, jobTitle = $$props.jobTitle);
    		if ('description' in $$props) $$invalidate(2, description = $$props.description);
    		if ('userImage' in $$props) $$invalidate(3, userImage = $$props.userImage);
    	};

    	$$self.$capture_state = () => ({
    		userName,
    		jobTitle,
    		description,
    		userImage,
    		initialName
    	});

    	$$self.$inject_state = $$props => {
    		if ('userName' in $$props) $$invalidate(0, userName = $$props.userName);
    		if ('jobTitle' in $$props) $$invalidate(1, jobTitle = $$props.jobTitle);
    		if ('description' in $$props) $$invalidate(2, description = $$props.description);
    		if ('userImage' in $$props) $$invalidate(3, userImage = $$props.userImage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userName, jobTitle, description, userImage];
    }

    class ContactCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			userName: 0,
    			jobTitle: 1,
    			description: 2,
    			userImage: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContactCard",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*userName*/ ctx[0] === undefined && !('userName' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'userName'");
    		}

    		if (/*jobTitle*/ ctx[1] === undefined && !('jobTitle' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'jobTitle'");
    		}

    		if (/*description*/ ctx[2] === undefined && !('description' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'description'");
    		}

    		if (/*userImage*/ ctx[3] === undefined && !('userImage' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'userImage'");
    		}
    	}

    	get userName() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userName(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get jobTitle() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set jobTitle(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userImage() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userImage(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/LifecycleHooks.svelte generated by Svelte v3.46.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/LifecycleHooks.svelte";

    // (52:2) {:else}
    function create_else_block$1(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*joke*/ ctx[0].value.joke + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Joke: ");
    			t1 = text(t1_value);
    			add_location(p, file$1, 52, 4, 1547);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*joke*/ 1 && t1_value !== (t1_value = /*joke*/ ctx[0].value.joke + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(52:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (50:49) 
    function create_if_block_1$1(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*joke*/ ctx[0].value + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Sorry, ");
    			t1 = text(t1_value);
    			t2 = text(" Please try again with different ID");
    			add_location(p, file$1, 50, 4, 1471);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*joke*/ 1 && t1_value !== (t1_value = /*joke*/ ctx[0].value + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(50:49) ",
    		ctx
    	});

    	return block;
    }

    // (48:2) {#if joke.type === 'loading'}
    function create_if_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading...";
    			add_location(p, file$1, 48, 4, 1399);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(48:2) {#if joke.type === 'loading'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let span0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let span1;
    	let t6_value = /*date*/ ctx[1].toLocaleTimeString() + "";
    	let t6;
    	let t7;

    	function select_block_type(ctx, dirty) {
    		if (/*joke*/ ctx[0].type === 'loading') return create_if_block$1;
    		if (/*joke*/ ctx[0].type === 'NoSuchQuoteException') return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("This component will be un-mounted in ");
    			span0 = element("span");
    			t1 = text(/*countDown*/ ctx[2]);
    			t2 = text("s");
    			t3 = text(".");
    			t4 = space();
    			p1 = element("p");
    			t5 = text("Current Time: ");
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			if_block.c();
    			attr_dev(span0, "class", "count-span svelte-4n1390");
    			add_location(span0, file$1, 45, 42, 1231);
    			add_location(p0, file$1, 45, 2, 1191);
    			attr_dev(span1, "class", "date-span svelte-4n1390");
    			add_location(span1, file$1, 46, 19, 1300);
    			add_location(p1, file$1, 46, 2, 1283);
    			attr_dev(div, "class", "lifecycle-card svelte-4n1390");
    			add_location(div, file$1, 44, 0, 1160);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, span0);
    			append_dev(span0, t1);
    			append_dev(span0, t2);
    			append_dev(p0, t3);
    			append_dev(div, t4);
    			append_dev(div, p1);
    			append_dev(p1, t5);
    			append_dev(p1, span1);
    			append_dev(span1, t6);
    			append_dev(div, t7);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*countDown*/ 4) set_data_dev(t1, /*countDown*/ ctx[2]);
    			if (dirty & /*date*/ 2 && t6_value !== (t6_value = /*date*/ ctx[1].toLocaleTimeString() + "")) set_data_dev(t6, t6_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function rnd(max) {
    	return Math.floor(Math.random() * max) + 14; // min. number will be 13
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LifecycleHooks', slots, []);
    	let joke = { type: 'loading', value: { joke: "" } };
    	let date = new Date();
    	let countDown = 20;

    	onMount(async () => {
    		const randomNum = rnd(300);
    		console.log('Component Mounted.');
    		const jokeUrl = `https://api.icndb.com/jokes/${randomNum}`;
    		const res = await fetch(jokeUrl); // Chuck Norris API to get a joke
    		$$invalidate(0, joke = await res.json());
    	});

    	// onMount(
    	//   fetch("https://jsonplaceholder.typicode.com/todos/1")
    	//     .then(response => response.json())
    	//     .then(todo => {
    	//       mytodo = todo;
    	//     })
    	// );
    	onDestroy(() => {
    		console.log('Component Unmounted.');
    		clearInterval(timer);
    	});

    	beforeUpdate(() => console.log('"beforeUpdate" will appear just before "the date" get increased.'));

    	afterUpdate(function () {
    		console.log('"afterUpdate" will appear just after "the date" get increased.');
    	});

    	let timer = setInterval(
    		() => {
    			$$invalidate(1, date = new Date());
    			$$invalidate(2, countDown -= 1);
    		},
    		1000
    	);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<LifecycleHooks> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		beforeUpdate,
    		afterUpdate,
    		joke,
    		date,
    		countDown,
    		timer,
    		rnd
    	});

    	$$self.$inject_state = $$props => {
    		if ('joke' in $$props) $$invalidate(0, joke = $$props.joke);
    		if ('date' in $$props) $$invalidate(1, date = $$props.date);
    		if ('countDown' in $$props) $$invalidate(2, countDown = $$props.countDown);
    		if ('timer' in $$props) timer = $$props.timer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [joke, date, countDown];
    }

    class LifecycleHooks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LifecycleHooks",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.2 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (98:0) {#if isFirstElDeleted}
    function create_if_block_2(ctx) {
    	let p;
    	let span;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = "Delete First";
    			t1 = text(" button won't work!");
    			attr_dev(span, "class", "note-style svelte-60vd36");
    			add_location(span, file, 98, 5, 2487);
    			add_location(p, file, 98, 2, 2484);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, span);
    			append_dev(p, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(98:0) {#if isFirstElDeleted}",
    		ctx
    	});

    	return block;
    }

    // (104:0) {:else}
    function create_else_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please fill the form.";
    			add_location(p, file, 104, 2, 2626);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(104:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (102:0) {#if formState === 'invalid'}
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Invalid Inputs";
    			add_location(p, file, 102, 2, 2594);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(102:0) {#if formState === 'invalid'}",
    		ctx
    	});

    	return block;
    }

    // (116:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please add some contacts. We found none!";
    			add_location(p, file, 116, 2, 2898);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(116:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (108:0) {#each createdContacts as contact, index (contact.id)}
    function create_each_block(key_1, ctx) {
    	let h2;
    	let t0;
    	let t1_value = /*index*/ ctx[19] + 1 + "";
    	let t1;
    	let t2;
    	let contactcard;
    	let current;

    	contactcard = new ContactCard({
    			props: {
    				userName: /*contact*/ ctx[17].name,
    				jobTitle: /*contact*/ ctx[17].title,
    				description: /*contact*/ ctx[17].desc,
    				userImage: /*contact*/ ctx[17].imageUrl
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			h2 = element("h2");
    			t0 = text("# ");
    			t1 = text(t1_value);
    			t2 = space();
    			create_component(contactcard.$$.fragment);
    			add_location(h2, file, 108, 2, 2719);
    			this.first = h2;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			insert_dev(target, t2, anchor);
    			mount_component(contactcard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*createdContacts*/ 128) && t1_value !== (t1_value = /*index*/ ctx[19] + 1 + "")) set_data_dev(t1, t1_value);
    			const contactcard_changes = {};
    			if (dirty & /*createdContacts*/ 128) contactcard_changes.userName = /*contact*/ ctx[17].name;
    			if (dirty & /*createdContacts*/ 128) contactcard_changes.jobTitle = /*contact*/ ctx[17].title;
    			if (dirty & /*createdContacts*/ 128) contactcard_changes.description = /*contact*/ ctx[17].desc;
    			if (dirty & /*createdContacts*/ 128) contactcard_changes.userImage = /*contact*/ ctx[17].imageUrl;
    			contactcard.$set(contactcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contactcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contactcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t2);
    			destroy_component(contactcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(108:0) {#each createdContacts as contact, index (contact.id)}",
    		ctx
    	});

    	return block;
    }

    // (122:0) {#if isLifeCycleOpen}
    function create_if_block(ctx) {
    	let lifecyclehooks;
    	let current;
    	lifecyclehooks = new LifecycleHooks({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(lifecyclehooks.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lifecyclehooks, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lifecyclehooks.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lifecyclehooks.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lifecyclehooks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(122:0) {#if isLifeCycleOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let div4;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div2;
    	let label2;
    	let t9;
    	let input2;
    	let t10;
    	let div3;
    	let label3;
    	let t12;
    	let textarea;
    	let t13;
    	let button0;
    	let t15;
    	let button1;
    	let t17;
    	let button2;
    	let t19;
    	let button3;
    	let t20_value = (/*isLifeCycleOpen*/ ctx[1] ? 'Hide ' : 'Show ') + "";
    	let t20;
    	let t21;
    	let t22;
    	let t23;
    	let t24;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t25;
    	let t26;
    	let br;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*isFirstElDeleted*/ ctx[8] && create_if_block_2(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*formState*/ ctx[6] === 'invalid') return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	let each_value = /*createdContacts*/ ctx[7];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*contact*/ ctx[17].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	let if_block2 = /*isLifeCycleOpen*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(/*appName*/ ctx[0]);
    			t1 = space();
    			div4 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "User Name";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Job Title";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Image URL";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = "Description";
    			t12 = space();
    			textarea = element("textarea");
    			t13 = space();
    			button0 = element("button");
    			button0.textContent = "Add Contact";
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = "Delete First";
    			t17 = space();
    			button2 = element("button");
    			button2.textContent = "Delete Last";
    			t19 = space();
    			button3 = element("button");
    			t20 = text(t20_value);
    			t21 = text(" Lifecycle Hooks");
    			t22 = space();
    			if (if_block0) if_block0.c();
    			t23 = space();
    			if_block1.c();
    			t24 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			t25 = space();
    			if (if_block2) if_block2.c();
    			t26 = space();
    			br = element("br");
    			attr_dev(h1, "class", "capitalize-it svelte-60vd36");
    			add_location(h1, file, 68, 0, 1407);
    			attr_dev(label0, "for", "userName");
    			add_location(label0, file, 71, 4, 1497);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "userName");
    			attr_dev(input0, "placeholder", "Add your name");
    			add_location(input0, file, 72, 4, 1541);
    			attr_dev(div0, "class", "form-control");
    			add_location(div0, file, 70, 2, 1466);
    			attr_dev(label1, "for", "jobTitle");
    			add_location(label1, file, 75, 4, 1664);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "jobTitle");
    			attr_dev(input1, "placeholder", "Add your job title");
    			add_location(input1, file, 76, 4, 1708);
    			attr_dev(div1, "class", "form-control");
    			add_location(div1, file, 74, 2, 1633);
    			attr_dev(label2, "for", "image");
    			add_location(label2, file, 79, 4, 1838);
    			attr_dev(input2, "type", "url");
    			attr_dev(input2, "id", "image");
    			attr_dev(input2, "placeholder", "Add your image url");
    			add_location(input2, file, 80, 4, 1879);
    			attr_dev(div2, "class", "form-control");
    			add_location(div2, file, 78, 2, 1807);
    			attr_dev(label3, "for", "desc");
    			add_location(label3, file, 83, 4, 2005);
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "id", "desc");
    			attr_dev(textarea, "placeholder", "Add some description.");
    			add_location(textarea, file, 84, 4, 2047);
    			attr_dev(div3, "class", "form-control");
    			add_location(div3, file, 82, 2, 1974);
    			attr_dev(div4, "id", "form");
    			attr_dev(div4, "class", "svelte-60vd36");
    			add_location(div4, file, 69, 0, 1448);
    			add_location(button0, file, 88, 0, 2156);
    			add_location(button1, file, 89, 0, 2209);
    			add_location(button2, file, 90, 0, 2271);
    			add_location(button3, file, 93, 0, 2330);
    			add_location(br, file, 124, 0, 3030);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*name*/ ctx[2]);
    			append_dev(div4, t4);
    			append_dev(div4, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			set_input_value(input1, /*title*/ ctx[3]);
    			append_dev(div4, t7);
    			append_dev(div4, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t9);
    			append_dev(div2, input2);
    			set_input_value(input2, /*image*/ ctx[4]);
    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			append_dev(div3, label3);
    			append_dev(div3, t12);
    			append_dev(div3, textarea);
    			set_input_value(textarea, /*description*/ ctx[5]);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, button3, anchor);
    			append_dev(button3, t20);
    			append_dev(button3, t21);
    			insert_dev(target, t22, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t23, anchor);
    			if_block1.m(target, anchor);
    			insert_dev(target, t24, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}

    			insert_dev(target, t25, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, br, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[14]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[15]),
    					listen_dev(button0, "click", /*addContact*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*deleteFirstEl*/ ctx[10], { once: true }, false, false),
    					listen_dev(button2, "click", /*deleteLastEl*/ ctx[11], false, false, false),
    					listen_dev(button3, "click", /*click_handler*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*appName*/ 1) set_data_dev(t0, /*appName*/ ctx[0]);

    			if (dirty & /*name*/ 4 && input0.value !== /*name*/ ctx[2]) {
    				set_input_value(input0, /*name*/ ctx[2]);
    			}

    			if (dirty & /*title*/ 8 && input1.value !== /*title*/ ctx[3]) {
    				set_input_value(input1, /*title*/ ctx[3]);
    			}

    			if (dirty & /*image*/ 16) {
    				set_input_value(input2, /*image*/ ctx[4]);
    			}

    			if (dirty & /*description*/ 32) {
    				set_input_value(textarea, /*description*/ ctx[5]);
    			}

    			if ((!current || dirty & /*isLifeCycleOpen*/ 2) && t20_value !== (t20_value = (/*isLifeCycleOpen*/ ctx[1] ? 'Hide ' : 'Show ') + "")) set_data_dev(t20, t20_value);

    			if (/*isFirstElDeleted*/ ctx[8]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(t23.parentNode, t23);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(t24.parentNode, t24);
    				}
    			}

    			if (dirty & /*createdContacts*/ 128) {
    				each_value = /*createdContacts*/ ctx[7];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, t25.parentNode, outro_and_destroy_block, create_each_block, t25, get_each_context);
    				check_outros();

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(t25.parentNode, t25);
    				}
    			}

    			if (/*isLifeCycleOpen*/ ctx[1]) {
    				if (if_block2) {
    					if (dirty & /*isLifeCycleOpen*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t26.parentNode, t26);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(button3);
    			if (detaching) detach_dev(t22);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t23);
    			if_block1.d(detaching);
    			if (detaching) detach_dev(t24);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (each_1_else) each_1_else.d(detaching);
    			if (detaching) detach_dev(t25);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { appName } = $$props;
    	let name = 'Mr. X';
    	let title = 'Self own job';
    	let image = 'https://api.lorem.space/image/face?w=150&h=150';
    	let description = "";
    	let formState = 'empty';
    	let createdContacts = [];
    	let isFirstElDeleted = false;
    	let isLifeCycleOpen = false;

    	// $: upperCaseName = name.toUpperCase(); // svelte will always update whenever variable 'name' changes
    	// $: console.log(name);
    	function addContact() {
    		if ((name.trim() === '', title.trim() === '', image.trim() === '', description.trim() === '')) {
    			$$invalidate(6, formState = 'invalid');
    			return;
    		}

    		$$invalidate(6, formState = 'done');

    		$$invalidate(7, createdContacts = [
    			...createdContacts,
    			{
    				id: Math.random(),
    				name,
    				title,
    				imageUrl: image,
    				desc: description
    			}
    		]);
    	}

    	function deleteFirstEl() {
    		$$invalidate(7, createdContacts = createdContacts.slice(1));
    		$$invalidate(8, isFirstElDeleted = true);
    	}

    	function deleteLastEl() {
    		$$invalidate(7, createdContacts = createdContacts.slice(0, -1));
    	}

    	const writable_props = ['appName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(2, name);
    	}

    	function input1_input_handler() {
    		title = this.value;
    		$$invalidate(3, title);
    	}

    	function input2_input_handler() {
    		image = this.value;
    		$$invalidate(4, image);
    	}

    	function textarea_input_handler() {
    		description = this.value;
    		$$invalidate(5, description);
    	}

    	const click_handler = () => $$invalidate(1, isLifeCycleOpen = !isLifeCycleOpen);

    	$$self.$$set = $$props => {
    		if ('appName' in $$props) $$invalidate(0, appName = $$props.appName);
    	};

    	$$self.$capture_state = () => ({
    		ContactCard,
    		LifecycleHooks,
    		appName,
    		name,
    		title,
    		image,
    		description,
    		formState,
    		createdContacts,
    		isFirstElDeleted,
    		isLifeCycleOpen,
    		addContact,
    		deleteFirstEl,
    		deleteLastEl
    	});

    	$$self.$inject_state = $$props => {
    		if ('appName' in $$props) $$invalidate(0, appName = $$props.appName);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('title' in $$props) $$invalidate(3, title = $$props.title);
    		if ('image' in $$props) $$invalidate(4, image = $$props.image);
    		if ('description' in $$props) $$invalidate(5, description = $$props.description);
    		if ('formState' in $$props) $$invalidate(6, formState = $$props.formState);
    		if ('createdContacts' in $$props) $$invalidate(7, createdContacts = $$props.createdContacts);
    		if ('isFirstElDeleted' in $$props) $$invalidate(8, isFirstElDeleted = $$props.isFirstElDeleted);
    		if ('isLifeCycleOpen' in $$props) $$invalidate(1, isLifeCycleOpen = $$props.isLifeCycleOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isLifeCycleOpen*/ 2) {
    			if (isLifeCycleOpen) {
    				setTimeout(
    					() => {
    						$$invalidate(1, isLifeCycleOpen = false);
    					},
    					20000
    				);
    			}
    		}
    	};

    	return [
    		appName,
    		isLifeCycleOpen,
    		name,
    		title,
    		image,
    		description,
    		formState,
    		createdContacts,
    		isFirstElDeleted,
    		addContact,
    		deleteFirstEl,
    		deleteLastEl,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		textarea_input_handler,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { appName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*appName*/ ctx[0] === undefined && !('appName' in props)) {
    			console.warn("<App> was created without expected prop 'appName'");
    		}
    	}

    	get appName() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set appName(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	// target: document.body,
      target: document.querySelector('#app'),
      // target: document.getElementById('app'),
      props: {
        appName: 'first svelte app'
      }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
