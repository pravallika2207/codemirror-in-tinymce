/**
 *
 *
 * @author Josh Lobe
 * http://ultimatetinymcepro.com
 * This is a culmination of various Codemirror addon scripts... minimized for use with WP.
 */
function style_html(e, t, n, r, i) {
    function s() {
        this.pos = 0;
        this.found_leading_whitespace = false;
        this.found_trailing_whitespace = false;
        this.token = "";
        this.current_mode = "CONTENT";
        this.tags = {
            parent: "parent1",
            parentcount: 1,
            parent1: ""
        };
        this.tag_type = "";
        this.token_text = this.last_token = this.last_tag_token = this.last_text = this.token_type = "";
        this.Utils = {
            whitespace: "\n\r	 ".split(""),
            inline_token: "a,abbr,acronym,b,bdo,big,br,button,cite,code,dfn,em,i,img,input,kbd,label,map,object,q,samp,script,select,small,span,strong,sub,sup,textarea,tt".split(","),
            single_token: "!doctype,?xml,area,base,basefont,br,embed,hr,img,input,isindex,link,meta,param,wbr".split(","),
            extra_liners: "body,head,/html".split(","),
            in_array: function(e, t) {
                for (var n = 0; n < t.length; n++) {
                    if (e === t[n]) {
                        return true
                    }
                }
                return false
            }
        };
        this.get_content = function() {
            var e = "";
            var t = [];
            var n = false;
            while (this.input.charAt(this.pos) !== "<") {
                if (this.pos >= this.input.length) {
                    return [t.join(""), "TK_EOF"]
                }
                e = this.input.charAt(this.pos);
                this.pos++;
                this.line_char_count++;
                if (this.Utils.in_array(e, this.Utils.whitespace)) {
                    if (t.length) {
                        n = true
                    } else {
                        this.found_leading_whitespace = true
                    }
                    this.line_char_count--;
                    this.found_trailing_whitespace = true;
                    continue
                } else if (n) {
                    if (this.line_char_count >= this.max_char) {
                        t.push("\n");
                        for (var r = 0; r < this.indent_level; r++) {
                            t.push(this.indent_string)
                        }
                        this.line_char_count = 0
                    } else {
                        t.push(" ");
                        this.line_char_count++
                    }
                    n = false;
                    this.found_trailing_whitespace = false
                }
                t.push(e)
            }
            return [t.join(""), "TK_CONTENT"]
        };
        this.get_script = function() {
            var e = "";
            var t = [];
            var n = "";
            var r = new RegExp("</script" + ">", "igm");
            r.lastIndex = this.pos;
            var i = r.exec(this.input);
            var s = i ? i.index : this.input.length;
            var o = this.pos >= this.input.length;
            while (this.pos < s && !o) {
                e = this.input.charAt(this.pos);
                this.pos++;
                o = this.pos >= this.input.length;
                t.push(e)
            }
            n = !t.length ? "" : js_beautify(t.join(""), {
                indent_size: this.indent_size,
                indent_char: this.indent_character,
                indent_level: this.indent_level,
                brace_style: this.brace_style
            });
            return [n, o ? "TK_EOF" : "TK_CONTENT"]
        };
        this.record_tag = function(e) {
            if (this.tags[e + "count"]) {
                this.tags[e + "count"]++;
                this.tags[e + this.tags[e + "count"]] = this.indent_level
            } else {
                this.tags[e + "count"] = 1;
                this.tags[e + this.tags[e + "count"]] = this.indent_level
            }
            this.tags[e + this.tags[e + "count"] + "parent"] = this.tags.parent;
            this.tags.parent = e + this.tags[e + "count"]
        };
        this.retrieve_tag = function(e) {
            if (this.tags[e + "count"]) {
                var t = this.tags.parent;
                while (t) {
                    if (e + this.tags[e + "count"] === t) {
                        break
                    }
                    t = this.tags[t + "parent"]
                }
                if (t) {
                    this.indent_level = this.tags[e + this.tags[e + "count"]];
                    this.tags.parent = this.tags[t + "parent"]
                }
                delete this.tags[e + this.tags[e + "count"] + "parent"];
                delete this.tags[e + this.tags[e + "count"]];
                if (this.tags[e + "count"] == 1) {
                    delete this.tags[e + "count"]
                } else {
                    this.tags[e + "count"]--
                }
            }
        };
        this.get_tag = function() {
            var e = "";
            var t = [];
            var n = false;
            do {
                if (this.pos >= this.input.length) {
                    return [t.join(""), "TK_EOF"]
                }
                e = this.input.charAt(this.pos);
                this.pos++;
                this.line_char_count++;
                if (this.Utils.in_array(e, this.Utils.whitespace)) {
                    n = true;
                    this.line_char_count--;
                    continue
                }
                if (e === "'" || e === '"') {
                    if (!t[1] || t[1] !== "!") {
                        e += this.get_unformatted(e);
                        n = true
                    }
                }
                if (t[t.length - 1] === "<" || e === "=") {
                    n = false
                }
                if (n && t.length && t[t.length - 1] !== "=" && e !== ">") {
                    if (this.line_char_count >= this.max_char) {
                        this.print_newline(false, t);
                        this.line_char_count = 0
                    } else {
                        t.push(" ");
                        this.line_char_count++
                    }
                    n = false
                }
                t.push(e)
            } while (e !== ">");
            var r = t.join("");
            var i;
            if (r.indexOf(" ") != -1) {
                i = r.indexOf(" ")
            } else {
                i = r.indexOf(">")
            }
            var s = r.substring(1, i).toLowerCase();
            if (r.charAt(r.length - 2) === "/" || this.Utils.in_array(s, this.Utils.single_token)) {
                this.tag_type = "SINGLE"
            } else if (s === "script") {
                this.record_tag(s);
                this.tag_type = "SCRIPT"
            } else if (s === "style") {
                this.record_tag(s);
                this.tag_type = "STYLE"
            } else if (this.Utils.in_array(s, this.Utils.inline_token)) {
                var o = this.get_unformatted("</" + s + ">", r);
                t.push(o);
                this.tag_type = "INLINE"
            } else if (s.charAt(0) === "!") {
                if (s.indexOf("[if") != -1) {
                    if (r.indexOf("!IE") != -1) {
                        var u = this.get_unformatted("-->", r);
                        t.push(u)
                    }
                    this.tag_type = "START"
                } else if (s.indexOf("[endif") != -1) {
                    this.tag_type = "END";
                    this.unindent()
                } else if (s.indexOf("[cdata[") != -1) {
                    var u = this.get_unformatted("]]>", r);
                    t.push(u);
                    this.tag_type = "SINGLE"
                } else {
                    var u = this.get_unformatted("-->", r);
                    t.push(u);
                    this.tag_type = "SINGLE"
                }
            } else {
                if (s.charAt(0) === "/") {
                    this.retrieve_tag(s.substring(1));
                    this.tag_type = "END"
                } else {
                    this.record_tag(s);
                    this.tag_type = "START"
                }
                if (this.Utils.in_array(s, this.Utils.extra_liners)) {
                    this.print_newline(true, this.output)
                }
            }
            return [t.join(""), "TK_TAG_" + this.tag_type]
        };
        this.get_unformatted = function(e, t) {
            if (t && t.indexOf(e) != -1) {
                return ""
            }
            var n = "";
            var r = "";
            var i = true;
            do {
                if (this.pos >= this.input.length) {
                    return r
                }
                n = this.input.charAt(this.pos);
                this.pos++;
                if (this.Utils.in_array(n, this.Utils.whitespace)) {
                    if (!i) {
                        this.line_char_count--;
                        continue
                    }
                    if (n === "\n" || n === "\r") {
                        r += "\n";
                        for (var s = 0; s < this.indent_level; s++) {
                            r += this.indent_string
                        }
                        i = false;
                        this.line_char_count = 0;
                        continue
                    }
                }
                r += n;
                this.line_char_count++;
                i = true
            } while (r.indexOf(e) == -1);
            return r
        };
        this.get_token = function() {
            if (this.last_token === "TK_TAG_SCRIPT") {
                return this.get_script()
            }
            if (this.current_mode === "CONTENT") {
                return this.get_content()
            }
            if (this.current_mode === "TAG") {
                return this.get_tag()
            }
        };
        this.printer = function(e, t, n, r, i) {
            this.input = e || "";
            this.output = [];
            this.indent_character = t || " ";
            this.indent_string = "";
            this.indent_size = n || 2;
            this.brace_style = i || "collapse";
            this.indent_level = 0;
            this.max_char = r || 70;
            this.line_char_count = 0;
            for (var s = 0; s < this.indent_size; s++) {
                this.indent_string += this.indent_character
            }
            this.print_newline = function(e, t) {
                this.line_char_count = 0;
                if (!t || !t.length) {
                    return
                }
                if (!e) {
                    while (this.Utils.in_array(t[t.length - 1], this.Utils.whitespace)) {
                        t.pop()
                    }
                }
                t.push("\n");
                for (var n = 0; n < this.indent_level; n++) {
                    t.push(this.indent_string)
                }
            };
            this.print_token = function(e) {
                this.output.push(e)
            };
            this.indent = function() {
                this.indent_level++
            };
            this.unindent = function() {
                if (this.indent_level > 0) {
                    this.indent_level--
                }
            }
        };
        return this
    }
    var s, o;
    var u = false;
    o = new s;
    o.printer(e, n, t, r, i);
    do {
        var a = o.get_token();
        o.token_text = a[0];
        o.token_type = a[1];
        switch (o.token_type) {
            case "TK_TAG_START":
            case "TK_TAG_SCRIPT":
            case "TK_TAG_STYLE":
                o.print_newline(false, o.output);
                o.print_token(o.token_text);
                o.indent();
                o.current_mode = "CONTENT";
                o.last_tag_token = o.token_type;
                break;
            case "TK_TAG_END":
                o.print_newline(true, o.output);
                o.print_token(o.token_text);
                o.current_mode = "CONTENT";
                o.last_tag_token = o.token_type;
                break;
            case "TK_TAG_SINGLE":
                o.print_newline(false, o.output);
                o.print_token(o.token_text);
                o.current_mode = "CONTENT";
                o.last_tag_token = o.token_type;
                break;
            case "TK_TAG_INLINE":
                if (u && o.last_token === "TK_CONTENT" || !o.last_text && o.last_tag_token !== "TK_TAG_INLINE") {
                    o.print_newline(false, o.output)
                }
                o.print_token(o.token_text);
                o.current_mode = "CONTENT";
                o.last_tag_token = o.token_type;
                break;
            case "TK_EOF":
            case "TK_CONTENT":
                if (o.token_text !== "") {
                    if (o.last_token === "TK_TAG_INLINE") {
                        if (o.found_leading_whitespace) {
                            o.print_newline(false, o.output)
                        }
                    } else {
                        o.print_newline(false, o.output)
                    }
                    o.print_token(o.token_text)
                }
                o.current_mode = "TAG";
                break
        }
        o.last_token = o.token_type;
        o.last_text = o.token_text;
        u = o.found_trailing_whitespace;
        o.found_leading_whitespace = false;
        o.found_trailing_whitespace = false
    } while (o.token_type !== "TK_EOF");
    var ret = o.output.join("");
    var start = ret.indexOf("<style>"),
        end = ret.indexOf("</style>");
    if(start >= end) {
        // either the html is fucked or there is no style tag, return as it is
	return ret;
	// evil laugh if the html is fucked
    }
    var ret1 = ret.substring(0, start + 7),
        ret2 = ret.substring(start + 8, end - 1),
	ret3 = ret.substring(end -1, ret.length);

    //alert("ret1 = " + ret1 + "\nret2 = " + ret2 + "\nret3 = " + ret3 + "\n");
    var indentedcss = []
    for(var index = 0; index < ret2.length; index++) {
        indentedcss.push(ret2.charAt(index));
	if(ret2.charAt(index) == '{') {
	    indentedcss.push('\n');
	}
	if(ret2.charAt(index) == '}') {
	    indentedcss.push('\n');
	}
	if(ret2.charAt(index) == ';') {
	    indentedcss.push('\n');
	}
    }
    ret2 = indentedcss.join('');
    ret = ret1 + '\n' + ret2 + ret3;
    return ret;
}
/*
CodeMirror.defineMode("htmlmixed", function(e, t) {
    function a(e, t) {
        var s = t.htmlState.tagName;
        var o = n.token(e, t.htmlState);
        if (s == "script" && /\btag\b/.test(o) && e.current() == ">") {
            var u = e.string.slice(Math.max(0, e.pos - 100), e.pos).match(/\btype\s*=\s*("[^"]+"|'[^']+'|\S+)[^<]*$/i);
            u = u ? u[1] : "";
            if (u && /[\"\']/.test(u.charAt(0))) u = u.slice(1, u.length - 1);
            for (var a = 0; a < i.length; ++a) {
                var f = i[a];
                if (typeof f.matches == "string" ? u == f.matches : f.matches.test(u)) {
                    if (f.mode) {
                        t.token = l;
                        t.localMode = f.mode;
                        t.localState = f.mode.startState && f.mode.startState(n.indent(t.htmlState, ""))
                    }
                    break
                }
            }
        } else if (s == "style" && /\btag\b/.test(o) && e.current() == ">") {
            t.token = c;
            t.localMode = r;
            t.localState = r.startState(n.indent(t.htmlState, ""))
        }
        return o
    }

    function f(e, t, n) {
        var r = e.current();
        var i = r.search(t),
            s;
        if (i > -1) e.backUp(r.length - i);
        else if (s = r.match(/<\/?$/)) {
            e.backUp(r.length);
            if (!e.match(t, false)) e.match(r)
        }
        return n
    }

    function l(e, t) {
        if (e.match(/^<\/\s*script\s*>/i, false)) {
            t.token = a;
            t.localState = t.localMode = null;
            return a(e, t)
        }
        return f(e, /<\/\s*script\s*>/, t.localMode.token(e, t.localState))
    }

    function c(e, t) {
        if (e.match(/^<\/\s*style\s*>/i, false)) {
            t.token = a;
            t.localState = t.localMode = null;
            return a(e, t)
        }
        return f(e, /<\/\s*style\s*>/, r.token(e, t.localState))
    }
    var n = CodeMirror.getMode(e, {
        name: "xml",
        htmlMode: true
    });
    var r = CodeMirror.getMode(e, "css");
    var i = [],
        s = t && t.scriptTypes;
    i.push({
        matches: /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^$/i,
        mode: CodeMirror.getMode(e, "javascript")
    });
    if (s)
        for (var o = 0; o < s.length; ++o) {
            var u = s[o];
            i.push({
                matches: u.matches,
                mode: u.mode && CodeMirror.getMode(e, u.mode)
            })
        }
    i.push({
        matches: /./,
        mode: CodeMirror.getMode(e, "text/plain")
    });
    return {
        startState: function() {
            var e = n.startState();
            return {
                token: a,
                localMode: null,
                localState: null,
                htmlState: e
            }
        },
        copyState: function(e) {
            if (e.localState) var t = CodeMirror.copyState(e.localMode, e.localState);
            return {
                token: e.token,
                localMode: e.localMode,
                localState: t,
                htmlState: CodeMirror.copyState(n, e.htmlState)
            }
        },
        token: function(e, t) {
            return t.token(e, t)
        },
        indent: function(e, t) {
            if (!e.localMode || /^\s*<\//.test(t)) return n.indent(e.htmlState, t);
            else if (e.localMode.indent) return e.localMode.indent(e.localState, t);
            else return CodeMirror.Pass
        },
        innerMode: function(e) {
            return {
                state: e.localState || e.htmlState,
                mode: e.localMode || n
            }
        }
    }
}, "xml", "javascript", "css");
CodeMirror.defineMIME("text/html", "htmlmixed");
CodeMirror.defineMode("xml", function(e, t) {
    function l(e, t) {
        function n(n) {
            t.tokenize = n;
            return n(e, t)
        }
        var r = e.next();
        if (r == "<") {
            if (e.eat("!")) {
                if (e.eat("[")) {
                    if (e.match("CDATA[")) return n(p("atom", "]]>"));
                    else return null
                } else if (e.match("--")) {
                    return n(p("comment", "-->"))
                } else if (e.match("DOCTYPE", true, true)) {
                    e.eatWhile(/[\w\._\-]/);
                    return n(d(1))
                } else {
                    return null
                }
            } else if (e.eat("?")) {
                e.eatWhile(/[\w\._\-]/);
                t.tokenize = p("meta", "?>");
                return "meta"
            } else {
                var i = e.eat("/");
                u = "";
                var s;
                while (s = e.eat(/[^\s\u00a0=<>\"\'\/?]/)) u += s;
                if (!u) return "tag error";
                a = i ? "closeTag" : "openTag";
                t.tokenize = c;
                return "tag"
            }
        } else if (r == "&") {
            var o;
            if (e.eat("#")) {
                if (e.eat("x")) {
                    o = e.eatWhile(/[a-fA-F\d]/) && e.eat(";")
                } else {
                    o = e.eatWhile(/[\d]/) && e.eat(";")
                }
            } else {
                o = e.eatWhile(/[\w\.\-:]/) && e.eat(";")
            }
            return o ? "atom" : "error"
        } else {
            e.eatWhile(/[^&<]/);
            return null
        }
    }

    function c(e, t) {
        var n = e.next();
        if (n == ">" || n == "/" && e.eat(">")) {
            t.tokenize = l;
            a = n == ">" ? "endTag" : "selfcloseTag";
            return "tag"
        } else if (n == "=") {
            a = "equals";
            return null
        } else if (n == "<") {
            t.tokenize = l;
            t.state = y;
            t.tagName = t.tagStart = null;
            var r = t.tokenize(e, t);
            return r ? r + " error" : "error"
        } else if (/[\'\"]/.test(n)) {
            t.tokenize = h(n);
            t.stringStartCol = e.column();
            return t.tokenize(e, t)
        } else {
            e.eatWhile(/[^\s\u00a0=<>\"\']/);
            return "word"
        }
    }

    function h(e) {
        var t = function(t, n) {
            while (!t.eol()) {
                if (t.next() == e) {
                    n.tokenize = c;
                    break
                }
            }
            return "string"
        };
        t.isInAttribute = true;
        return t
    }

    function p(e, t) {
        return function(n, r) {
            while (!n.eol()) {
                if (n.match(t)) {
                    r.tokenize = l;
                    break
                }
                n.next()
            }
            return e
        }
    }

    function d(e) {
        return function(t, n) {
            var r;
            while ((r = t.next()) != null) {
                if (r == "<") {
                    n.tokenize = d(e + 1);
                    return n.tokenize(t, n)
                } else if (r == ">") {
                    if (e == 1) {
                        n.tokenize = l;
                        break
                    } else {
                        n.tokenize = d(e - 1);
                        return n.tokenize(t, n)
                    }
                }
            }
            return "meta"
        }
    }

    function v(e, t, n) {
        this.prev = e.context;
        this.tagName = t;
        this.indent = e.indented;
        this.startOfLine = n;
        if (s.doNotIndent.hasOwnProperty(t) || e.context && e.context.noIndent) this.noIndent = true
    }

    function m(e) {
        if (e.context) e.context = e.context.prev
    }

    function g(e, t) {
        var n;
        while (true) {
            if (!e.context) {
                return
            }
            n = e.context.tagName.toLowerCase();
            if (!s.contextGrabbers.hasOwnProperty(n) || !s.contextGrabbers[n].hasOwnProperty(t)) {
                return
            }
            m(e)
        }
    }

    function y(e, t, n) {
        if (e == "openTag") {
            n.tagName = u;
            n.tagStart = t.column();
            return E
        } else if (e == "closeTag") {
            var r = false;
            if (n.context) {
                if (n.context.tagName != u) {
                    if (s.implicitlyClosed.hasOwnProperty(n.context.tagName.toLowerCase())) m(n);
                    r = !n.context || n.context.tagName != u
                }
            } else {
                r = true
            }
            if (r) f = "error";
            return r ? w : b
        } else {
            return y
        }
    }

    function b(e, t, n) {
        if (e != "endTag") {
            f = "error";
            return b
        }
        m(n);
        return y
    }

    function w(e, t, n) {
        f = "error";
        return b(e, t, n)
    }

    function E(e, t, n) {
        if (e == "word") {
            f = "attribute";
            return S
        } else if (e == "endTag" || e == "selfcloseTag") {
            var r = n.tagName,
                i = n.tagStart;
            n.tagName = n.tagStart = null;
            if (e == "selfcloseTag" || s.autoSelfClosers.hasOwnProperty(r.toLowerCase())) {
                g(n, r.toLowerCase())
            } else {
                g(n, r.toLowerCase());
                n.context = new v(n, r, i == n.indented)
            }
            return y
        }
        f = "error";
        return E
    }

    function S(e, t, n) {
        if (e == "equals") return x;
        if (!s.allowMissing) f = "error";
        return E(e, t, n)
    }

    function x(e, t, n) {
        if (e == "string") return T;
        if (e == "word" && s.allowUnquoted) {
            f = "string";
            return E
        }
        f = "error";
        return E(e, t, n)
    }

    function T(e, t, n) {
        if (e == "string") return T;
        return E(e, t, n)
    }
    var n = e.indentUnit;
    var r = t.multilineTagIndentFactor || 1;
    var i = t.multilineTagIndentPastTag;
    if (i == null) i = true;
    var s = t.htmlMode ? {
        autoSelfClosers: {
            area: true,
            base: true,
            br: true,
            col: true,
            command: true,
            embed: true,
            frame: true,
            hr: true,
            img: true,
            input: true,
            keygen: true,
            link: true,
            meta: true,
            param: true,
            source: true,
            track: true,
            wbr: true
        },
        implicitlyClosed: {
            dd: true,
            li: true,
            optgroup: true,
            option: true,
            p: true,
            rp: true,
            rt: true,
            tbody: true,
            td: true,
            tfoot: true,
            th: true,
            tr: true
        },
        contextGrabbers: {
            dd: {
                dd: true,
                dt: true
            },
            dt: {
                dd: true,
                dt: true
            },
            li: {
                li: true
            },
            option: {
                option: true,
                optgroup: true
            },
            optgroup: {
                optgroup: true
            },
            p: {
                address: true,
                article: true,
                aside: true,
                blockquote: true,
                dir: true,
                div: true,
                dl: true,
                fieldset: true,
                footer: true,
                form: true,
                h1: true,
                h2: true,
                h3: true,
                h4: true,
                h5: true,
                h6: true,
                header: true,
                hgroup: true,
                hr: true,
                menu: true,
                nav: true,
                ol: true,
                p: true,
                pre: true,
                section: true,
                table: true,
                ul: true
            },
            rp: {
                rp: true,
                rt: true
            },
            rt: {
                rp: true,
                rt: true
            },
            tbody: {
                tbody: true,
                tfoot: true
            },
            td: {
                td: true,
                th: true
            },
            tfoot: {
                tbody: true
            },
            th: {
                td: true,
                th: true
            },
            thead: {
                tbody: true,
                tfoot: true
            },
            tr: {
                tr: true
            }
        },
        doNotIndent: {
            pre: true
        },
        allowUnquoted: true,
        allowMissing: true
    } : {
        autoSelfClosers: {},
        implicitlyClosed: {},
        contextGrabbers: {},
        doNotIndent: {},
        allowUnquoted: false,
        allowMissing: false
    };
    var o = t.alignCDATA;
    var u, a, f;
    return {
        startState: function() {
            return {
                tokenize: l,
                state: y,
                indented: 0,
                tagName: null,
                tagStart: null,
                context: null
            }
        },
        token: function(e, t) {
            if (!t.tagName && e.sol()) t.indented = e.indentation();
            if (e.eatSpace()) return null;
            u = a = null;
            var n = t.tokenize(e, t);
            if ((n || a) && n != "comment") {
                f = null;
                t.state = t.state(a || n, e, t);
                if (f) n = f == "error" ? n + " error" : f
            }
            return n
        },
        indent: function(e, t, s) {
            var u = e.context;
            if (e.tokenize.isInAttribute) {
                return e.stringStartCol + 1
            }
            if (u && u.noIndent) return CodeMirror.Pass;
            if (e.tokenize != c && e.tokenize != l) return s ? s.match(/^(\s*)/)[0].length : 0;
            if (e.tagName) {
                if (i) return e.tagStart + e.tagName.length + 2;
                else return e.tagStart + n * r
            }
            if (o && /<!\[CDATA\[/.test(t)) return 0;
            if (u && /^<\//.test(t)) u = u.prev;
            while (u && !u.startOfLine) u = u.prev;
            if (u) return u.indent + n;
            else return 0
        },
        electricChars: "/",
        blockCommentStart: "<!--",
        blockCommentEnd: "-->",
        configuration: t.htmlMode ? "html" : "xml",
        helperType: t.htmlMode ? "html" : "xml"
    }
});
CodeMirror.defineMIME("text/xml", "xml");
CodeMirror.defineMIME("application/xml", "xml");
if (!CodeMirror.mimeModes.hasOwnProperty("text/html")) CodeMirror.defineMIME("text/html", {
    name: "xml",
    htmlMode: true
});
(function() {
    "use strict";

    function n(n) {
        if ("activeLine" in n.state) {
            n.removeLineClass(n.state.activeLine, "wrap", e);
            n.removeLineClass(n.state.activeLine, "background", t)
        }
    }

    function r(r, i) {
        var s = r.getLineHandleVisualStart(i);
        if (r.state.activeLine == s) return;
        r.operation(function() {
            n(r);
            r.addLineClass(s, "wrap", e);
            r.addLineClass(s, "background", t);
            r.state.activeLine = s
        })
    }

    function i(e, t) {
        r(e, t.head.line)
    }
    var e = "CodeMirror-activeline";
    var t = "CodeMirror-activeline-background";
    CodeMirror.defineOption("styleActiveLine", false, function(e, t, s) {
        var o = s && s != CodeMirror.Init;
        if (t && !o) {
            r(e, e.getCursor().line);
            e.on("beforeSelectionChange", i)
        } else if (!t && o) {
            e.off("beforeSelectionChange", i);
            n(e);
            delete e.state.activeLine
        }
    })
})();
(function() {
    "use strict";

    function e(e) {
        e.operation(function() {
            a(e)
        })
    }

    function t(e) {
        if (e.state.markedSelection.length) e.operation(function() {
            o(e)
        })
    }

    function i(e, t) {
        return e.line - t.line || e.ch - t.ch
    }

    function s(e, t, s, o) {
        if (i(t, s) == 0) return;
        var u = e.state.markedSelection;
        var a = e.state.markedSelectionStyle;
        for (var f = t.line;;) {
            var l = f == t.line ? t : r(f, 0);
            var c = f + n,
                h = c >= s.line;
            var p = h ? s : r(c, 0);
            var d = e.markText(l, p, {
                className: a
            });
            if (o == null) u.push(d);
            else u.splice(o++, 0, d);
            if (h) break;
            f = c
        }
    }

    function o(e) {
        var t = e.state.markedSelection;
        for (var n = 0; n < t.length; ++n) t[n].clear();
        t.length = 0
    }

    function u(e) {
        o(e);
        var t = e.getCursor("start"),
            n = e.getCursor("end");
        s(e, t, n)
    }

    function a(e) {
        var t = e.getCursor("start"),
            r = e.getCursor("end");
        if (i(t, r) == 0) return o(e);
        var a = e.state.markedSelection;
        if (!a.length) return s(e, t, r);
        var f = a[0].find(),
            l = a[a.length - 1].find();
        if (!f || !l || r.line - t.line < n || i(t, l.to) >= 0 || i(r, f.from) <= 0) return u(e);
        while (i(t, f.from) > 0) {
            a.shift().clear();
            f = a[0].find()
        }
        if (i(t, f.from) < 0) {
            if (f.to.line - t.line < n) {
                a.shift().clear();
                s(e, t, f.to, 0)
            } else {
                s(e, t, f.from, 0)
            }
        }
        while (i(r, l.to) < 0) {
            a.pop().clear();
            l = a[a.length - 1].find()
        }
        if (i(r, l.to) > 0) {
            if (r.line - l.from.line < n) {
                a.pop().clear();
                s(e, l.from, r)
            } else {
                s(e, l.to, r)
            }
        }
    }
    CodeMirror.defineOption("styleSelectedText", false, function(n, r, i) {
        var s = i && i != CodeMirror.Init;
        if (r && !s) {
            n.state.markedSelection = [];
            n.state.markedSelectionStyle = typeof r == "string" ? r : "CodeMirror-selectedtext";
            u(n);
            n.on("cursorActivity", e);
            n.on("change", t)
        } else if (!r && s) {
            n.off("cursorActivity", e);
            n.off("change", t);
            o(n);
            n.state.markedSelection = n.state.markedSelectionStyle = null
        }
    });
    var n = 8;
    var r = CodeMirror.Pos
})();
(function() {
    function e(e, t) {
        var n;
        if (typeof e == "string") {
            n = e.charAt(0);
            e = new RegExp("^" + e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), t ? "i" : "")
        } else {
            e = new RegExp("^(?:" + e.source + ")", e.ignoreCase ? "i" : "")
        }
        if (typeof e == "string") return {
            token: function(t) {
                if (t.match(e)) return "searching";
                t.next();
                t.skipTo(e.charAt(0)) || t.skipToEnd()
            }
        };
        return {
            token: function(t) {
                if (t.match(e)) return "searching";
                while (!t.eol()) {
                    t.next();
                    if (n) t.skipTo(n) || t.skipToEnd();
                    if (t.match(e, false)) break
                }
            }
        }
    }

    function t() {
        this.posFrom = this.posTo = this.query = null;
        this.overlay = null
    }

    function n(e) {
        return e.state.search || (e.state.search = new t)
    }

    function r(e) {
        return typeof e == "string" && e == e.toLowerCase()
    }

    function i(e, t, n) {
        return e.getSearchCursor(t, n, r(t))
    }

    function s(e, t, n, r, i) {
        if (e.openDialog) e.openDialog(t, i, {
            value: r
        });
        else i(prompt(n, r))
    }

    function o(e, t, n, r) {
        if (e.openConfirm) e.openConfirm(t, r);
        else if (confirm(n)) r[0]()
    }

    function u(e) {
        var t = e.match(/^\/(.*)\/([a-z]*)$/);
        if (t) {
            e = new RegExp(t[1], t[2].indexOf("i") == -1 ? "" : "i");
            if (e.test("")) e = /x^/
        } else if (e == "") {
            e = /x^/
        }
        return e
    }

    function f(t, i) {
        var o = n(t);
        if (o.query) return l(t, i);
        s(t, a, "Search for:", t.getSelection(), function(n) {
            t.operation(function() {
                if (!n || o.query) return;
                o.query = u(n);
                t.removeOverlay(o.overlay, r(o.query));
                o.overlay = e(o.query);
                t.addOverlay(o.overlay);
                o.posFrom = o.posTo = t.getCursor();
                l(t, i)
            })
        })
    }

    function l(e, t) {
        e.operation(function() {
            var r = n(e);
            var s = i(e, r.query, t ? r.posFrom : r.posTo);
            if (!s.find(t)) {
                s = i(e, r.query, t ? CodeMirror.Pos(e.lastLine()) : CodeMirror.Pos(e.firstLine(), 0));
                if (!s.find(t)) return
            }
            e.setSelection(s.from(), s.to());
            e.scrollIntoView({
                from: s.from(),
                to: s.to()
            });
            r.posFrom = s.from();
            r.posTo = s.to()
        })
    }

    function c(e) {
        e.operation(function() {
            var t = n(e);
            if (!t.query) return;
            t.query = null;
            e.removeOverlay(t.overlay)
        })
    }

    function v(e, t) {
        s(e, h, "Replace:", e.getSelection(), function(n) {
            if (!n) return;
            n = u(n);
            s(e, p, "Replace with:", "", function(r) {
                if (t) {
                    e.operation(function() {
                        for (var t = i(e, n); t.findNext();) {
                            if (typeof n != "string") {
                                var s = e.getRange(t.from(), t.to()).match(n);
                                t.replace(r.replace(/\$(\d)/, function(e, t) {
                                    return s[t]
                                }))
                            } else t.replace(r)
                        }
                    })
                } else {
                    c(e);
                    var s = i(e, n, e.getCursor());
                    var u = function() {
                        var t = s.from(),
                            r;
                        if (!(r = s.findNext())) {
                            s = i(e, n);
                            if (!(r = s.findNext()) || t && s.from().line == t.line && s.from().ch == t.ch) return
                        }
                        e.setSelection(s.from(), s.to());
                        e.scrollIntoView({
                            from: s.from(),
                            to: s.to()
                        });
                        o(e, d, "Replace?", [function() {
                            a(r)
                        }, u])
                    };
                    var a = function(e) {
                        s.replace(typeof n == "string" ? r : r.replace(/\$(\d)/, function(t, n) {
                            return e[n]
                        }));
                        u()
                    };
                    u()
                }
            })
        })
    }
    var a = 'Search: <input type="text" style="width: 10em"/> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';
    var h = 'Replace: <input type="text" style="width: 10em"/> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';
    var p = 'With: <input type="text" style="width: 10em"/>';
    var d = "Replace? <button>Yes</button> <button>No</button> <button>Stop</button>";
    CodeMirror.commands.find = function(e) {
        c(e);
        f(e)
    };
    CodeMirror.commands.findNext = f;
    CodeMirror.commands.findPrev = function(e) {
        f(e, true)
    };
    CodeMirror.commands.clearSearch = c;
    CodeMirror.commands.replace = v;
    CodeMirror.commands.replaceAll = function(e) {
        v(e, true)
    }
})();
(function() {
    function t(t, r, i, s) {
        this.atOccurrence = false;
        this.doc = t;
        if (s == null && typeof r == "string") s = false;
        i = i ? t.clipPos(i) : e(0, 0);
        this.pos = {
            from: i,
            to: i
        };
        if (typeof r != "string") {
            if (!r.global) r = new RegExp(r.source, r.ignoreCase ? "ig" : "g");
            this.matches = function(n, i) {
                if (n) {
                    r.lastIndex = 0;
                    var s = t.getLine(i.line).slice(0, i.ch),
                        o = 0,
                        u, a;
                    for (;;) {
                        r.lastIndex = o;
                        var f = r.exec(s);
                        if (!f) break;
                        u = f;
                        a = u.index;
                        o = u.index + (u[0].length || 1);
                        if (o == s.length) break
                    }
                    var l = u && u[0].length || 0;
                    if (!l) {
                        if (a == 0 && s.length == 0) {
                            u = undefined
                        } else if (a != t.getLine(i.line).length) {
                            l++
                        }
                    }
                } else {
                    r.lastIndex = i.ch;
                    var s = t.getLine(i.line),
                        u = r.exec(s);
                    var l = u && u[0].length || 0;
                    var a = u && u.index;
                    if (a + l != s.length && !l) l = 1
                }
                if (u && l) return {
                    from: e(i.line, a),
                    to: e(i.line, a + l),
                    match: u
                }
            }
        } else {
            var o = r;
            if (s) r = r.toLowerCase();
            var u = s ? function(e) {
                return e.toLowerCase()
            } : function(e) {
                return e
            };
            var a = r.split("\n");
            if (a.length == 1) {
                if (!r.length) {
                    this.matches = function() {}
                } else {
                    this.matches = function(i, s) {
                        if (i) {
                            var a = t.getLine(s.line).slice(0, s.ch),
                                f = u(a);
                            var l = f.lastIndexOf(r);
                            if (l > -1) {
                                l = n(a, f, l);
                                return {
                                    from: e(s.line, l),
                                    to: e(s.line, l + o.length)
                                }
                            }
                        } else {
                            var a = t.getLine(s.line).slice(s.ch),
                                f = u(a);
                            var l = f.indexOf(r);
                            if (l > -1) {
                                l = n(a, f, l) + s.ch;
                                return {
                                    from: e(s.line, l),
                                    to: e(s.line, l + o.length)
                                }
                            }
                        }
                    }
                }
            } else {
                var f = o.split("\n");
                this.matches = function(n, r) {
                    var i = a.length - 1;
                    if (n) {
                        if (r.line - (a.length - 1) < t.firstLine()) return;
                        if (u(t.getLine(r.line).slice(0, f[i].length)) != a[a.length - 1]) return;
                        var s = e(r.line, f[i].length);
                        for (var o = r.line - 1, l = i - 1; l >= 1; --l, --o)
                            if (a[l] != u(t.getLine(o))) return;
                        var c = t.getLine(o),
                            h = c.length - f[0].length;
                        if (u(c.slice(h)) != a[0]) return;
                        return {
                            from: e(o, h),
                            to: s
                        }
                    } else {
                        if (r.line + (a.length - 1) > t.lastLine()) return;
                        var c = t.getLine(r.line),
                            h = c.length - f[0].length;
                        if (u(c.slice(h)) != a[0]) return;
                        var p = e(r.line, h);
                        for (var o = r.line + 1, l = 1; l < i; ++l, ++o)
                            if (a[l] != u(t.getLine(o))) return;
                        if (t.getLine(o).slice(0, f[i].length) != a[i]) return;
                        return {
                            from: p,
                            to: e(o, f[i].length)
                        }
                    }
                }
            }
        }
    }

    function n(e, t, n) {
        if (e.length == t.length) return n;
        for (var r = Math.min(n, e.length);;) {
            var i = e.slice(0, r).toLowerCase().length;
            if (i < n) ++r;
            else if (i > n) --r;
            else return r
        }
    }
    var e = CodeMirror.Pos;
    t.prototype = {
        findNext: function() {
            return this.find(false)
        },
        findPrevious: function() {
            return this.find(true)
        },
        find: function(t) {
            function i(t) {
                var r = e(t, 0);
                n.pos = {
                    from: r,
                    to: r
                };
                n.atOccurrence = false;
                return false
            }
            var n = this,
                r = this.doc.clipPos(t ? this.pos.from : this.pos.to);
            for (;;) {
                if (this.pos = this.matches(t, r)) {
                    this.atOccurrence = true;
                    return this.pos.match || true
                }
                if (t) {
                    if (!r.line) return i(0);
                    r = e(r.line - 1, this.doc.getLine(r.line - 1).length)
                } else {
                    var s = this.doc.lineCount();
                    if (r.line == s - 1) return i(s);
                    r = e(r.line + 1, 0)
                }
            }
        },
        from: function() {
            if (this.atOccurrence) return this.pos.from
        },
        to: function() {
            if (this.atOccurrence) return this.pos.to
        },
        replace: function(t) {
            if (!this.atOccurrence) return;
            var n = CodeMirror.splitLines(t);
            this.doc.replaceRange(n, this.pos.from, this.pos.to);
            this.pos.to = e(this.pos.from.line + n.length - 1, n[n.length - 1].length + (n.length == 1 ? this.pos.from.ch : 0))
        }
    };
    CodeMirror.defineExtension("getSearchCursor", function(e, n, r) {
        return new t(this.doc, e, n, r)
    });
    CodeMirror.defineDocExtension("getSearchCursor", function(e, n, r) {
        return new t(this, e, n, r)
    })
})();
(function() {
    function r(r) {
        if (typeof r == "object") {
            this.minChars = r.minChars;
            this.style = r.style;
            this.showToken = r.showToken;
            this.delay = r.delay
        }
        if (this.style == null) this.style = t;
        if (this.minChars == null) this.minChars = e;
        if (this.delay == null) this.delay = n;
        this.overlay = this.timeout = null
    }

    function i(e) {
        var t = e.state.matchHighlighter;
        clearTimeout(t.timeout);
        t.timeout = setTimeout(function() {
            s(e)
        }, t.delay)
    }

    function s(e) {
        e.operation(function() {
            var t = e.state.matchHighlighter;
            if (t.overlay) {
                e.removeOverlay(t.overlay);
                t.overlay = null
            }
            if (!e.somethingSelected() && t.showToken) {
                var n = t.showToken === true ? /[\w$]/ : t.showToken;
                var r = e.getCursor(),
                    i = e.getLine(r.line),
                    s = r.ch,
                    o = s;
                while (s && n.test(i.charAt(s - 1))) --s;
                while (o < i.length && n.test(i.charAt(o))) ++o;
                if (s < o) e.addOverlay(t.overlay = u(i.slice(s, o), n, t.style));
                return
            }
            if (e.getCursor("head").line != e.getCursor("anchor").line) return;
            var a = e.getSelection().replace(/^\s+|\s+$/g, "");
            if (a.length >= t.minChars) e.addOverlay(t.overlay = u(a, false, t.style))
        })
    }

    function o(e, t) {
        return (!e.start || !t.test(e.string.charAt(e.start - 1))) && (e.pos == e.string.length || !t.test(e.string.charAt(e.pos)))
    }

    function u(e, t, n) {
        return {
            token: function(r) {
                if (r.match(e) && (!t || o(r, t))) return n;
                r.next();
                r.skipTo(e.charAt(0)) || r.skipToEnd()
            }
        }
    }
    var e = 2;
    var t = "matchhighlight";
    var n = 100;
    CodeMirror.defineOption("highlightSelectionMatches", false, function(e, t, n) {
        if (n && n != CodeMirror.Init) {
            var o = e.state.matchHighlighter.overlay;
            if (o) e.removeOverlay(o);
            clearTimeout(e.state.matchHighlighter.timeout);
            e.state.matchHighlighter = null;
            e.off("cursorActivity", i)
        }
        if (t) {
            e.state.matchHighlighter = new r(t);
            s(e);
            e.on("cursorActivity", i)
        }
    })
})()
*/
