/*global describe, it, afterEach, before*/
"use strict";

const chai = require("chai"),
  os = require("os"),
  constants = require("../lib/constants"),
  expect = chai.expect,
  path = require("path");

chai.use(require("sinon-chai"));
require("mocha-sinon");

const msbuildFinderSpec = require("../lib/msbuild-finder");

describe("msbuild-finder", function () {
  const fs = require("fs");

  describe("linux platorm", function () {
    const child = require("child_process");

    it("should use msbuild if possible", function () {

      const mock = this.sinon.mock(child);
      mock.expects("spawnSync").withArgs("which", [ "msbuild" ], { encoding: "utf8" }).returns({});

      const result = msbuildFinderSpec.find({ platform: "linux" });

      expect(result).to.be.equal("msbuild");
    });

    it("should fallback to xbuild when msbuild is not present", function () {

      const mock = this.sinon.mock(child);
      mock.expects("spawnSync").withArgs("which", [ "msbuild" ], { encoding: "utf8" }).returns({
        stderr: 1
      });

      const result = msbuildFinderSpec.find({ platform: "linux" });
      expect(result).to.be.equal("xbuild");
    });
  });

  describe("darwin platorm", function () {
    const child = require("child_process");

    it("should use msbuild if possible", function () {

      const mock = this.sinon.mock(child);
      mock.expects("spawnSync").withArgs("which", [ "msbuild" ], { encoding: "utf8" }).returns({});

      const result = msbuildFinderSpec.find({ platform: "darwin" });

      expect(result).to.be.equal("msbuild");
    });

    it("should fallback to xbuild when msbuild is not present", function () {

      const mock = this.sinon.mock(child);
      mock.expects("spawnSync").withArgs("which", [ "msbuild" ], { encoding: "utf8" }).returns({
        stderr: 1
      });

      const result = msbuildFinderSpec.find({ platform: "darwin" });
      expect(result).to.be.equal("xbuild");
    });
  });

  it("should use xbuild on unknown platform", function () {
    const result = msbuildFinderSpec.find({ platform: "xyz" });

    expect(result).to.be.equal("xbuild");
  });

  describe(`falling back on GAC-installed .net framework`, () => {
    if (!process.env.WINDIR) {
      it.skip(`Can't run GAC-based tests on this machine: No WINDIR env var`, () => {
      });
      return;
    }
    const basePath = path.join(process.env.WINDIR, "Microsoft.NET");
    if (!dirExists(basePath)) {
      it.skip(`Can't run GAC-based tests on this machine: no Microsoft.NET folder under ${
        process.env.WINDIR}`, () => {
      });
      return;
    }
    it("should use msbuild on windows", function () {
      const toolsVersion = 3.5;
      const result = msbuildFinderSpec.find({
        platform: "win32",
        toolsVersion: toolsVersion,
        // windir: windir
      });

      expect(result)
        .to.match(/Framework\\v3.5\\MSBuild.exe$/);
    });

    it("should use 64bit msbuild on 64bit windows", function () {
      const defaults = JSON.parse(JSON.stringify(constants.DEFAULTS));

      const windir = "WINDIR";
      const toolsVersion = 3.5;
      const result = msbuildFinderSpec.find({
        ...defaults,
        platform: "win32",
        toolsVersion: toolsVersion,
        windir: windir
      });

      expect(result)
        .to.match(/Framework64\\v3.5\\MSBuild.exe$/);
    });

    it("should use 64bit msbuild on windows with provided x64 architecture", function () {
      const windir = "WINDIR";
      const toolsVersion = 3.5;
      const result = msbuildFinderSpec.find({
        platform: "win32",
        toolsVersion: toolsVersion,
        windir: windir,
        architecture: "x64"
      });

      expect(result)
        .to.match(/Framework64\\v3.5\\MSBuild.exe/);
    });
  });

  it("should use visual studio community msbuild 15 on windows with visual studio 2017 project and visual studio community installed", function () {
    const toolsVersion = 15.0;

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const vsEnterprisePath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Enterprise");
    const vsProfessionalPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Professional");
    const vsCommunityPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Community");

    const mock = this.sinon.mock(fs);
    mock.expects("statSync").withArgs(vsEnterprisePath).throws();
    mock.expects("statSync").withArgs(vsProfessionalPath).throws();
    mock.expects("statSync").withArgs(vsCommunityPath).returns({});

    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x86" });

    expect(result)
      .to.match(/[\\|\/]15.0[\\|\/]Bin[\\|\/]MSBuild.exe/);
  });

  // this fails without vs2017 installed
  it.skip("should use visual studio build tools msbuild 15 on windows with visual studio 2017 project and visual studio build tools installed", function () {
    if (os.platform() !== "win32") {
      return this.skip();
    }
    const toolsVersion = 15.0;

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const vsEnterprisePath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Enterprise");
    const vsProfessionalPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Professional");
    const vsCommunityPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Community");
    const vsBuildToolsPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "BuildTools");

    const mock = this.sinon.mock(fs);
    mock.expects("statSync").withArgs(vsEnterprisePath).throws();
    mock.expects("statSync").withArgs(vsProfessionalPath).throws();
    mock.expects("statSync").withArgs(vsCommunityPath).throws();
    mock.expects("statSync").withArgs(vsBuildToolsPath).returns({});

    const result = msbuildFinderSpec.find({
      platform: "win32",
      toolsVersion: toolsVersion,
      architecture: "x86"
    });

    expect(!!result.match(/2017[\\|\/]BuildTools[\\|\/]MSBuild[\\|\/]15.0[\\|\/]Bin[\\|\/]MSBuild.exe$/))
      .to.be.true;
  });

  it("should fall back to legacy build path on windows with visual studio 2017 project and visual studio is not installed", function () {
    if (os.platform() !== "win32") {
      return this.skip();
    }
    const toolsVersion = 15.0;

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const vsEnterprisePath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Enterprise");
    const vsProfessionalPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Professional");
    const vsCommunityPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Community");
    const vsBuildToolsPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "BuildTools");

    const mock = this.sinon.mock(fs);
    mock.expects("statSync").withArgs(vsEnterprisePath).throws();
    mock.expects("statSync").withArgs(vsProfessionalPath).throws();
    mock.expects("statSync").withArgs(vsCommunityPath).throws();
    mock.expects("statSync").withArgs(vsBuildToolsPath).throws();

    const result = msbuildFinderSpec.find({
      platform: "win32",
      toolsVersion: toolsVersion,
      architecture: "x86"
    });

    expect(result)
      .to.match(/[\\|\/]15.0[\\|\/]Bin[\\|\/]MSBuild.exe$/);
  });

  describe(`should find version 16 from vs2019, when present`, () => {
    // part of handling versions > 15 is allowing auto-detection of what is present
    //  as such, there's too much to easily mock this out and these tests
    //  will only apply if the host has vs2019 installed
    const
      found = msbuildFinderSpec.msBuildFromWhere("C:/Program Files (x86)"),
      foundPath = found[0] || "";
    const year = foundPath.split(path.sep)
      .filter(s => s.match(/^\d\d\d\d$/))[0];
    if (parseInt(year) === 2019) {
      it("should find the x64 msbuild when toolsVersion set to 16.0", function () {
        const result = msbuildFinderSpec.find({
          platform: "win32",
          toolsVersion: 16.0,
          architecture: "x64"
        });
        const parts = result.split(path.sep);
        expect(parts).to.contain("amd64");
        expect(parts.indexOf("2019")).to.be.at.least(0);
        expect(parts[parts.length - 1].toLowerCase()).to.equal("msbuild.exe");
        expect(fs.existsSync(result)).to.be.true;
      });

      it("should find the x64 msbuild when toolsVersion set to 'auto'", function () {
          const result = msbuildFinderSpec.find({
            platform: "win32",
            toolsVersion: "auto",
            architecture: "x64"
          });
          const parts = result.split(path.sep);
          expect(parts).to.contain("amd64");
          expect(parts.indexOf("2019")).to.be.at.least(0);
          expect(parts[parts.length - 1].toLowerCase()).to.equal("msbuild.exe");
          expect(fs.existsSync(result)).to.be.true;
        }
      );
    }

    // this fails when no vs2017 installed
    describe.skip(`should find vs2017 on demand, when installed side-by-side with vs2019`, () => {
      if (os.platform() !== "win32") {
        return it.skip(`skipped on !win32`, () => {
        });
      }
      const
        all = msbuildFinderSpec.msBuildFromWhere("C:/Program Files (x86)", true),
        vs2017 = all.filter(pair => pair[0].indexOf("2017") > 0);
      if (vs2017) {
        it(`should find vs2017 installation`, () => {
          const result = msbuildFinderSpec.find({
            platform: "win32",
            toolsVersion: 15.0,
            architecture: "x64"
          });
          const parts = result.split(path.sep);
          expect(parts).to.contain("amd64");
          expect(parts.indexOf("2017")).to.be.at.least(0);
          expect(parts[parts.length - 1].toLowerCase()).to.equal("msbuild.exe");
          expect(fs.existsSync(result)).to.be.true;
        });
      }
    });
  });

  it("should throw error with invalid toolsVersion", function () {
    const func = function () {
      return msbuildFinderSpec.find({ platform: "win32", toolsVersion: -1 });
    };

    expect(func).to.throw(/invalid MSBuild version was supplied/i);
  });

  function dirExists(at) {
    try {
      const st = fs.statSync(at);
      return st && st.isDirectory();
    } catch (e) {
      return false;
    }
  }

});
