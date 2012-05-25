var contexts = {};

exports = module.exports = function uuid() {
	return exports.context('global')();
};

exports.release = function release() {
	return exports.context('global').release();
};

exports.contexts = contexts;

exports.context = function context(name) {
	contexts[name] = contexts[name] || 0;
	
	function uuid() {
		return contexts[name]++;
	};
	
	uuid.release = function release() {
		contexts[name]--;
		
		return uuid;
	};
	
	return uuid;
};
