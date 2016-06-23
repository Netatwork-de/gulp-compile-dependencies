'use strict'
// Copyright 2016 Net at Work GmbH
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	 http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
let Promise = require('rsvp').Promise;
let asp = require('rsvp').denodeify;
let fs = require('graceful-fs');
let path = require('path');
let gutil = require('gulp-util');
let spawn = require('child_process').spawn;

let dependencyPath = 'jspm_packages/local';

async function getPackageObject(packageFile) {
	try {
		let lookupJSON = await asp(fs.readFile)(packageFile);
		return JSON.parse(lookupJSON.toString());
	}
	catch (e) {
		if (e.code == 'ENOENT' || e instanceof SyntaxError)
			return { notfound: true };
		throw e;
	}
}

function fileExists (filepath) {
	if (!filepath) return false

	try {
		return fs.statSync(filepath).isFile();
	} catch (e) {
		return false;
	}
}

async function processDependency(packagePath, options) {
	let packageName = packagePath.substring(0, packagePath.indexOf('@'));
	gutil.log("Compiling package", gutil.colors.yellow(packageName));

	let project = await getPackageObject(path.resolve('..', path.join(packageName, 'package.json')));
	let projectPath = path.resolve(path.join("..", packageName));

	let npmInstall = (options && options.npmInstall) ||true;
	let jspmInstall = (options && options.jspmInstall) || true;
	let gulpBuild = (otpions && options.gulpBuild) || true;

	if(npmInstall) {
		await executeNpm(projectPath, "install");
	}

	let isJspmPresent = project.devDependencies !== undefined && project.devDependencies["jspm"] != null;
	if (jspmInstall && isJspmPresent) {
		gutil.log(gutil.colors.yellow("jspm"), "is configured in this package. Running", gutil.colors.yellow("jspm install"));
		await executeJspm(projectPath);
	}

	if (gulpBuild && fileExists(path.join(projectPath, "gulpfile.js"))) {
		gutil.log(gutil.colors.yellow("gulp"), "is configured in this package. Running", gutil.colors.yellow("gulp build"));
		await executeGulp(projectPath);
	}
}

export function executeGulp(packagePath, tasks) {
	gutil.log("Processing", gutil.colors.yellow("gulp"), "for", gutil.colors.yellow(packagePath));
	return spawnProcess("gulp", packagePath, tasks || ["build"]);
}

export function executeJspm(packagePath) {
	gutil.log("Processing", gutil.colors.yellow("jspm"), "for", gutil.colors.yellow(packagePath));
	return spawnProcess("jspm", packagePath || path.resolve("."), ["install"]);
}

export function executeNpm(packagePath, action) {
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
	}
	let commandToExecute = command;

	if (runningOnWindows) {
		args = ['/s', '/c',	command + ".cmd"].concat(args);
		commandToExecute = 'cmd';

		opts.windowsVerbatimArguments = true;
	}

	return new Promise((resolve, reject) => {
		let proc = spawn(commandToExecute, args, opts);
		proc.on('close', function(code) {
			let error;

			if (code == 0) {
				resolve();
				return;
			}
			error = new gutil.PluginError(`${command} on ${packagePath} returned ${code}`);
			reject(error);
		});
	});
}

function isDirectory(fileName) {
	let filePath = path.resolve(dependencyPath, fileName);
	return fs.lstatSync(filePath).isDirectory();
}

async function getLocalDependencies() {
	let packageConfig = await getPackageObject("package.json");

	if (!packageConfig.jspm || !packageConfig.jspm.dependencies) throw "package.json does have jspm configured.";

	let localDepedencies = [];

	var dependencies = packageConfig.jspm.dependencies;
	for (let dependency in dependencies)
	{
		var value = dependencies[dependency];
		if (value.indexOf("local:") == 0) {
			localDepedencies.push(value.substring("local:".length))
		}
	}
	return localDepedencies;
}

export async function buildDependencies(options) {
	gutil.log("Building local dependencies");
	let dependencies = await getLocalDependencies();
	for (let entry of dependencies) {
		await processDependency(entry,options);
	}
}
