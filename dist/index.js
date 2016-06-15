'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

let getPackageObject = (() => {
	var ref = _asyncToGenerator(function* (packageFile) {
		try {
			let lookupJSON = yield asp(fs.readFile)(packageFile);
			return JSON.parse(lookupJSON.toString());
		} catch (e) {
			if (e.code == 'ENOENT' || e instanceof SyntaxError) return { notfound: true };
			throw e;
		}
	});

	return function getPackageObject(_x) {
		return ref.apply(this, arguments);
	};
})();

let processDependency = (() => {
	var ref = _asyncToGenerator(function* (packagePath, options) {
		let packageName = packagePath.substring(0, packagePath.indexOf('@'));
		gutil.log("Compiling package", gutil.colors.yellow(packageName));

		let project = yield getPackageObject(path.resolve('..', path.join(packageName, 'package.json')));
		let projectPath = path.resolve(path.join("..", packageName));

		let npmInstall = options.npmInstall !== undefined ? options.npmInstall : true;
		let jspmInstall = options.jspmInstall !== undefined ? options.jspmInstall : true;
		let gulpBuild = options.gulpBuild !== undefined ? options.gulpBuild : true;

		if (npmInstall) {
			yield executeNpm(projectPath, "install");
		}

		let isJspmPresent = project.devDependencies !== undefined && project.devDependencies["jspm"] != null;
		if (jspmInstall && isJspmPresent) {
			gutil.log(gutil.colors.yellow("jspm"), "is configured in this package. Running", gutil.colors.yellow("jspm install"));
			yield executeJspm(projectPath);
		}

		if (gulpBuild && fileExists(path.join(projectPath, "gulpfile.js"))) {
			gutil.log(gutil.colors.yellow("gulp"), "is configured in this package. Running", gutil.colors.yellow("gulp build"));
			yield executeGulp(projectPath);
		}
	});

	return function processDependency(_x2, _x3) {
		return ref.apply(this, arguments);
	};
})();

let getLocalDependencies = (() => {
	var ref = _asyncToGenerator(function* () {
		let packageConfig = yield getPackageObject("package.json");

		if (!packageConfig.jspm || !packageConfig.jspm.dependencies) throw "package.json does have jspm configured.";

		let localDepedencies = [];

		var dependencies = packageConfig.jspm.dependencies;
		for (let dependency in dependencies) {
			var value = dependencies[dependency];
			if (value.indexOf("local:") == 0) {
				localDepedencies.push(value.substring("local:".length));
			}
		}
		return localDepedencies;
	});

	return function getLocalDependencies() {
		return ref.apply(this, arguments);
	};
})();

let buildDependencies = exports.buildDependencies = (() => {
	var ref = _asyncToGenerator(function* (options) {
		gutil.log("Building local dependencies");
		let dependencies = yield getLocalDependencies();
		for (let entry of dependencies) {
			yield processDependency(entry, options);
		}
	});

	return function buildDependencies(_x4) {
		return ref.apply(this, arguments);
	};
})();

exports.executeGulp = executeGulp;
exports.executeJspm = executeJspm;
exports.executeNpm = executeNpm;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

let Promise = require('rsvp').Promise;
let asp = require('rsvp').denodeify;
let fs = require('graceful-fs');
let path = require('path');
let gutil = require('gulp-util');
let spawn = require('child_process').spawn;

let dependencyPath = 'jspm_packages/local';

function fileExists(filepath) {
	if (!filepath) return false;

	try {
		return fs.statSync(filepath).isFile();
	} catch (e) {
		return false;
	}
}

function executeGulp(packagePath, tasks) {
	gutil.log("Processing", gutil.colors.yellow("gulp"), "for", gutil.colors.yellow(packagePath));
	return spawnProcess("gulp", packagePath, tasks || ["build"]);
}

function executeJspm(packagePath) {
	gutil.log("Processing", gutil.colors.yellow("jspm"), "for", gutil.colors.yellow(packagePath));
	return spawnProcess("jspm", packagePath || path.resolve("."), ["install"]);
}

function executeNpm(packagePath, action) {
	gutil.log("Processing", gutil.colors.yellow("npm"), "for", gutil.colors.yellow(packagePath));
	return spawnProcess("npm", packagePath || path.resolve("."), [action || "install"]);
}

function spawnProcess(command, workingDirectory, args) {
	let runningOnWindows = /^win/.test(process.platform);
	let nodeModulesPath = path.join(workingDirectory, 'node_modules', '.bin');
	let envCopy = {};
	for (let e in process.env) envCopy[e] = process.env[e];

	if (runningOnWindows) {
		envCopy.Path += ';' + nodeModulesPath;
	} else {
		envCopy.PATH += ':' + nodeModulesPath;
	}

	let opts = {
		cwd: workingDirectory,
		env: envCopy,
		stdio: 'inherit',
		stderr: 'inherit'
	};
	let commandToExecute = command;

	if (runningOnWindows) {
		args = ['/s', '/c', command + ".cmd"].concat(args);
		commandToExecute = 'cmd';

		opts.windowsVerbatimArguments = true;
	}

	return new Promise((resolve, reject) => {
		let proc = spawn(commandToExecute, args, opts);
		proc.on('close', function (code) {
			let error;

			if (code == 0) {
				resolve();
				return;
			}
			error = new gutil.PluginError(`${ command } on ${ packagePath } returned ${ code }`);
			reject(error);
		});
	});
}

function isDirectory(fileName) {
	let filePath = path.resolve(dependencyPath, fileName);
	return fs.lstatSync(filePath).isDirectory();
}
//# sourceMappingURL=data:application/json;base64,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cHlyaWdodCAyMDE2IE5ldCBhdCBXb3JrIEdtYkhcclxuLy9cclxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuLy9cclxuLy9cdCBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuLy9cclxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG5sZXQgUHJvbWlzZSA9IHJlcXVpcmUoJ3JzdnAnKS5Qcm9taXNlO1xyXG5sZXQgYXNwID0gcmVxdWlyZSgncnN2cCcpLmRlbm9kZWlmeTtcclxubGV0IGZzID0gcmVxdWlyZSgnZ3JhY2VmdWwtZnMnKTtcclxubGV0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XHJcbmxldCBndXRpbCA9IHJlcXVpcmUoJ2d1bHAtdXRpbCcpO1xyXG5sZXQgc3Bhd24gPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJykuc3Bhd247XHJcblxyXG5sZXQgZGVwZW5kZW5jeVBhdGggPSAnanNwbV9wYWNrYWdlcy9sb2NhbCc7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRQYWNrYWdlT2JqZWN0KHBhY2thZ2VGaWxlKSB7XHJcblx0dHJ5IHtcclxuXHRcdGxldCBsb29rdXBKU09OID0gYXdhaXQgYXNwKGZzLnJlYWRGaWxlKShwYWNrYWdlRmlsZSk7XHJcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShsb29rdXBKU09OLnRvU3RyaW5nKCkpO1xyXG5cdH1cclxuXHRjYXRjaCAoZSkge1xyXG5cdFx0aWYgKGUuY29kZSA9PSAnRU5PRU5UJyB8fCBlIGluc3RhbmNlb2YgU3ludGF4RXJyb3IpXHJcblx0XHRcdHJldHVybiB7IG5vdGZvdW5kOiB0cnVlIH07XHJcblx0XHR0aHJvdyBlO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gZmlsZUV4aXN0cyAoZmlsZXBhdGgpIHtcclxuXHRpZiAoIWZpbGVwYXRoKSByZXR1cm4gZmFsc2VcclxuXHJcblx0dHJ5IHtcclxuXHRcdHJldHVybiBmcy5zdGF0U3luYyhmaWxlcGF0aCkuaXNGaWxlKCk7XHJcblx0fSBjYXRjaCAoZSkge1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc0RlcGVuZGVuY3kocGFja2FnZVBhdGgsIG9wdGlvbnMpIHtcclxuXHRsZXQgcGFja2FnZU5hbWUgPSBwYWNrYWdlUGF0aC5zdWJzdHJpbmcoMCwgcGFja2FnZVBhdGguaW5kZXhPZignQCcpKTtcclxuXHRndXRpbC5sb2coXCJDb21waWxpbmcgcGFja2FnZVwiLCBndXRpbC5jb2xvcnMueWVsbG93KHBhY2thZ2VOYW1lKSk7XHJcblxyXG5cdGxldCBwcm9qZWN0ID0gYXdhaXQgZ2V0UGFja2FnZU9iamVjdChwYXRoLnJlc29sdmUoJy4uJywgcGF0aC5qb2luKHBhY2thZ2VOYW1lLCAncGFja2FnZS5qc29uJykpKTtcclxuXHRsZXQgcHJvamVjdFBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5qb2luKFwiLi5cIiwgcGFja2FnZU5hbWUpKTtcclxuXHJcblx0bGV0IG5wbUluc3RhbGwgPSAob3B0aW9ucy5ucG1JbnN0YWxsICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLm5wbUluc3RhbGwgOiB0cnVlKTtcclxuXHRsZXQganNwbUluc3RhbGwgPSAob3B0aW9ucy5qc3BtSW5zdGFsbCAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5qc3BtSW5zdGFsbCA6IHRydWUpO1xyXG5cdGxldCBndWxwQnVpbGQgPSAob3B0aW9ucy5ndWxwQnVpbGQgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuZ3VscEJ1aWxkIDogdHJ1ZSk7XHJcblxyXG5cdGlmKG5wbUluc3RhbGwpIHtcclxuXHRcdGF3YWl0IGV4ZWN1dGVOcG0ocHJvamVjdFBhdGgsIFwiaW5zdGFsbFwiKTtcclxuXHR9XHJcblxyXG5cdGxldCBpc0pzcG1QcmVzZW50ID0gcHJvamVjdC5kZXZEZXBlbmRlbmNpZXMgIT09IHVuZGVmaW5lZCAmJiBwcm9qZWN0LmRldkRlcGVuZGVuY2llc1tcImpzcG1cIl0gIT0gbnVsbDtcclxuXHRpZiAoanNwbUluc3RhbGwgJiYgaXNKc3BtUHJlc2VudCkge1xyXG5cdFx0Z3V0aWwubG9nKGd1dGlsLmNvbG9ycy55ZWxsb3coXCJqc3BtXCIpLCBcImlzIGNvbmZpZ3VyZWQgaW4gdGhpcyBwYWNrYWdlLiBSdW5uaW5nXCIsIGd1dGlsLmNvbG9ycy55ZWxsb3coXCJqc3BtIGluc3RhbGxcIikpO1xyXG5cdFx0YXdhaXQgZXhlY3V0ZUpzcG0ocHJvamVjdFBhdGgpO1xyXG5cdH1cclxuXHJcblx0aWYgKGd1bHBCdWlsZCAmJiBmaWxlRXhpc3RzKHBhdGguam9pbihwcm9qZWN0UGF0aCwgXCJndWxwZmlsZS5qc1wiKSkpIHtcclxuXHRcdGd1dGlsLmxvZyhndXRpbC5jb2xvcnMueWVsbG93KFwiZ3VscFwiKSwgXCJpcyBjb25maWd1cmVkIGluIHRoaXMgcGFja2FnZS4gUnVubmluZ1wiLCBndXRpbC5jb2xvcnMueWVsbG93KFwiZ3VscCBidWlsZFwiKSk7XHJcblx0XHRhd2FpdCBleGVjdXRlR3VscChwcm9qZWN0UGF0aCk7XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUd1bHAocGFja2FnZVBhdGgsIHRhc2tzKSB7XHJcblx0Z3V0aWwubG9nKFwiUHJvY2Vzc2luZ1wiLCBndXRpbC5jb2xvcnMueWVsbG93KFwiZ3VscFwiKSwgXCJmb3JcIiwgZ3V0aWwuY29sb3JzLnllbGxvdyhwYWNrYWdlUGF0aCkpO1xyXG5cdHJldHVybiBzcGF3blByb2Nlc3MoXCJndWxwXCIsIHBhY2thZ2VQYXRoLCB0YXNrcyB8fCBbXCJidWlsZFwiXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSnNwbShwYWNrYWdlUGF0aCkge1xyXG5cdGd1dGlsLmxvZyhcIlByb2Nlc3NpbmdcIiwgZ3V0aWwuY29sb3JzLnllbGxvdyhcImpzcG1cIiksIFwiZm9yXCIsIGd1dGlsLmNvbG9ycy55ZWxsb3cocGFja2FnZVBhdGgpKTtcclxuXHRyZXR1cm4gc3Bhd25Qcm9jZXNzKFwianNwbVwiLCBwYWNrYWdlUGF0aCB8fCBwYXRoLnJlc29sdmUoXCIuXCIpLCBbXCJpbnN0YWxsXCJdKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVOcG0ocGFja2FnZVBhdGgsIGFjdGlvbikge1xyXG5cdGd1dGlsLmxvZyhcIlByb2Nlc3NpbmdcIiwgZ3V0aWwuY29sb3JzLnllbGxvdyhcIm5wbVwiKSwgXCJmb3JcIiwgZ3V0aWwuY29sb3JzLnllbGxvdyhwYWNrYWdlUGF0aCkpO1xyXG5cdHJldHVybiBzcGF3blByb2Nlc3MoXCJucG1cIiwgcGFja2FnZVBhdGggfHwgcGF0aC5yZXNvbHZlKFwiLlwiKSwgW2FjdGlvbiB8fCBcImluc3RhbGxcIl0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzcGF3blByb2Nlc3MoY29tbWFuZCwgd29ya2luZ0RpcmVjdG9yeSwgYXJncykge1xyXG5cdGxldCBydW5uaW5nT25XaW5kb3dzID0gL153aW4vLnRlc3QocHJvY2Vzcy5wbGF0Zm9ybSk7XHJcblx0bGV0IG5vZGVNb2R1bGVzUGF0aCA9IHBhdGguam9pbih3b3JraW5nRGlyZWN0b3J5LCAnbm9kZV9tb2R1bGVzJywgJy5iaW4nKTtcclxuXHRsZXQgZW52Q29weSA9IHt9O1xyXG5cdGZvciAobGV0IGUgaW4gcHJvY2Vzcy5lbnYpIGVudkNvcHlbZV0gPSBwcm9jZXNzLmVudltlXTtcclxuXHJcblx0aWYgKHJ1bm5pbmdPbldpbmRvd3MpIHtcclxuXHRcdGVudkNvcHkuUGF0aCArPSAnOycgKyBub2RlTW9kdWxlc1BhdGg7XHJcblx0fSBlbHNlIHtcclxuXHRcdGVudkNvcHkuUEFUSCArPSAnOicgKyBub2RlTW9kdWxlc1BhdGg7XHJcblx0fVxyXG5cclxuXHRsZXQgb3B0cyA9IHtcclxuXHRcdGN3ZDogd29ya2luZ0RpcmVjdG9yeSxcclxuXHRcdGVudjogZW52Q29weSxcclxuXHRcdHN0ZGlvOiAnaW5oZXJpdCcsXHJcblx0XHRzdGRlcnI6ICdpbmhlcml0J1xyXG5cdH1cclxuXHRsZXQgY29tbWFuZFRvRXhlY3V0ZSA9IGNvbW1hbmQ7XHJcblxyXG5cdGlmIChydW5uaW5nT25XaW5kb3dzKSB7XHJcblx0XHRhcmdzID0gWycvcycsICcvYycsXHRjb21tYW5kICsgXCIuY21kXCJdLmNvbmNhdChhcmdzKTtcclxuXHRcdGNvbW1hbmRUb0V4ZWN1dGUgPSAnY21kJztcclxuXHJcblx0XHRvcHRzLndpbmRvd3NWZXJiYXRpbUFyZ3VtZW50cyA9IHRydWU7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0bGV0IHByb2MgPSBzcGF3bihjb21tYW5kVG9FeGVjdXRlLCBhcmdzLCBvcHRzKTtcclxuXHRcdHByb2Mub24oJ2Nsb3NlJywgZnVuY3Rpb24oY29kZSkge1xyXG5cdFx0XHRsZXQgZXJyb3I7XHJcblxyXG5cdFx0XHRpZiAoY29kZSA9PSAwKSB7XHJcblx0XHRcdFx0cmVzb2x2ZSgpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRlcnJvciA9IG5ldyBndXRpbC5QbHVnaW5FcnJvcihgJHtjb21tYW5kfSBvbiAke3BhY2thZ2VQYXRofSByZXR1cm5lZCAke2NvZGV9YCk7XHJcblx0XHRcdHJlamVjdChlcnJvcik7XHJcblx0XHR9KTtcclxuXHR9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNEaXJlY3RvcnkoZmlsZU5hbWUpIHtcclxuXHRsZXQgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUoZGVwZW5kZW5jeVBhdGgsIGZpbGVOYW1lKTtcclxuXHRyZXR1cm4gZnMubHN0YXRTeW5jKGZpbGVQYXRoKS5pc0RpcmVjdG9yeSgpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRMb2NhbERlcGVuZGVuY2llcygpIHtcclxuXHRsZXQgcGFja2FnZUNvbmZpZyA9IGF3YWl0IGdldFBhY2thZ2VPYmplY3QoXCJwYWNrYWdlLmpzb25cIik7XHJcblxyXG5cdGlmICghcGFja2FnZUNvbmZpZy5qc3BtIHx8ICFwYWNrYWdlQ29uZmlnLmpzcG0uZGVwZW5kZW5jaWVzKSB0aHJvdyBcInBhY2thZ2UuanNvbiBkb2VzIGhhdmUganNwbSBjb25maWd1cmVkLlwiO1xyXG5cclxuXHRsZXQgbG9jYWxEZXBlZGVuY2llcyA9IFtdO1xyXG5cclxuXHR2YXIgZGVwZW5kZW5jaWVzID0gcGFja2FnZUNvbmZpZy5qc3BtLmRlcGVuZGVuY2llcztcclxuXHRmb3IgKGxldCBkZXBlbmRlbmN5IGluIGRlcGVuZGVuY2llcylcclxuXHR7XHJcblx0XHR2YXIgdmFsdWUgPSBkZXBlbmRlbmNpZXNbZGVwZW5kZW5jeV07XHJcblx0XHRpZiAodmFsdWUuaW5kZXhPZihcImxvY2FsOlwiKSA9PSAwKSB7XHJcblx0XHRcdGxvY2FsRGVwZWRlbmNpZXMucHVzaCh2YWx1ZS5zdWJzdHJpbmcoXCJsb2NhbDpcIi5sZW5ndGgpKVxyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gbG9jYWxEZXBlZGVuY2llcztcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJ1aWxkRGVwZW5kZW5jaWVzKG9wdGlvbnMpIHtcclxuXHRndXRpbC5sb2coXCJCdWlsZGluZyBsb2NhbCBkZXBlbmRlbmNpZXNcIik7XHJcblx0bGV0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldExvY2FsRGVwZW5kZW5jaWVzKCk7XHJcblx0Zm9yIChsZXQgZW50cnkgb2YgZGVwZW5kZW5jaWVzKSB7XHJcblx0XHRhd2FpdCBwcm9jZXNzRGVwZW5kZW5jeShlbnRyeSxvcHRpb25zKTtcclxuXHR9XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
