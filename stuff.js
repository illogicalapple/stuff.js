function abc(target, ...args) {
	let object = target;
	let getters = [];
	let setters = [];
	abc._tests.reverse().forEach(element => {
		if(element.test(target)) {
			if(element.get) getters.push(element.get);
			if(element.set) setters.push(element.set);
		}
	});
	return new Proxy(object, {
		get(...args) {
			return getters.find(getter => getter(...args) != undefined);
		},
		set(...args) {
			return setters.forEach(setter => setter(...args));
		},
		...abc._traps
	});
}
abc._tests = [
	{
		test: e => e instanceof Object,
		get(object, prop) {
			if(object[prop]) return object[prop];
			if(prop = "$extend") {
				return function $extend(obj, overwrite) {
					let newObject = object;
					for(let element in obj) {
						if((!object[element]) || (overwrite ?? true)) newObject[element] = obj[element];
					}
					return newObject;
				};
			}
		}
	},
	{
		test: e => e instanceof Document,
		get(object, prop) {
			if(object[prop]) return object[prop];
			try {
				return object.querySelectorAll(prop);
			} catch(e) {
				return undefined;
			}
		}
	}
];
abc._traps = {};
const expansions = {
	http: {
		get(url, params, data) {
			let location = new URL(url);
			for(let param in params) {
				location.searchParams.set(param, params[param]);
			}
			return fetch(location.href, { method: "POST", ...data });
		},
		post(url, body, data) {
			return fetch(url, { method: "POST", body, ...data });
		},
		fetch(url, method, body, data) {
			return fetch(url, { method, body, ...data });
		}
	},
	$define(static, data, test) {
		if(static) {
			expansions[data.name] = data.value;
		} else {
			abc._tests.push({ test, ...data });
		}
	},
	$trap(trap) {
		abc._traps = abc(abc._traps).$extend(trap);
	}
}
for(let expansion in expansions) {
	abc[expansion] = expansions[expansion];
}
export default abc
