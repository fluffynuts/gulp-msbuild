/*global describe, it, afterEach, before*/
"use strict";

const chai = require("chai"),
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

  it("should use msbuild on windows", function () {
    const windir = "WINDIR";
    const toolsVersion = 3.5;
    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, windir: windir });

    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    const expectedResult = path.join(windir, "Microsoft.Net", "Framework", expectMSBuildVersion, "MSBuild.exe");

    expect(result).to.be.equal(expectedResult);
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
    })

    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    const expectedResult = path.join(windir, "Microsoft.Net", "Framework64", expectMSBuildVersion, "MSBuild.exe");

    expect(result).to.be.equal(expectedResult);
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

    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    const expectedResult = path.join(windir, "Microsoft.Net", "Framework64", expectMSBuildVersion, "MSBuild.exe");

    expect(result).to.be.equal(expectedResult);
  });

  it("should use msbuild 12 on windows with visual studio 2013 project", function () {
    const toolsVersion = 12.0;
    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x86" });

    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const expectedResult = path.join(pathRoot, "MSBuild", expectMSBuildVersion, "Bin", "MSBuild.exe");

    expect(result).to.be.equal(expectedResult);
  });

  it("should use 64bit msbuild 12 on windows x64 with visual studio 2013 project", function () {
    const toolsVersion = 12.0;
    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x64" });

    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    const pathRoot = process.env["ProgramFiles(x86)"] || path.join("C:", "Program Files (x86)");
    const expectedResult = path.join(pathRoot, "MSBuild", expectMSBuildVersion, "Bin/amd64", "MSBuild.exe");

    expect(result).to.be.equal(expectedResult);
  });

  it("should use msbuild 14 on windows with visual studio 2015 project", function () {
    const toolsVersion = 14.0;
    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x86" });

    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const expectedResult = path.join(pathRoot, "MSBuild", expectMSBuildVersion, "Bin", "MSBuild.exe");

    expect(result).to.be.equal(expectedResult);
  });

  it("should use 64bit msbuild 14 on windows x64 with visual studio 2015 project", function () {
    const toolsVersion = 14.0;
    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x64" });

    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];
    const pathRoot = process.env["ProgramFiles(x86)"] || path.join("C:", "Program Files (x86)");
    const expectedResult = path.join(pathRoot, "MSBuild/", expectMSBuildVersion, "Bin/amd64", "MSBuild.exe");

    expect(result).to.be.equal(expectedResult);
  });

  it("should use visual studio enterprise msbuild 15 on windows with visual studio 2017 project and visual studio enterprise installed", function () {
    const toolsVersion = 15.0;
    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const expectedResult = path.join(pathRoot, "MSBuild", "15.0", "Bin", "MSBuild.exe");

    const mock = this.sinon.mock(fs);
    mock.expects("statSync").withArgs(pathRoot).returns({});

    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x86" });

    expect(result).to.be.equal(expectedResult);
  });

  it("should use visual studio professional msbuild 15 on windows with visual studio 2017 project and visual studio professional installed", function () {
    const toolsVersion = 15.0;
    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const vsEnterprisePath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Enterprise");
    const vsProfessionalPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Professional");
    const expectedResult = path.join(vsProfessionalPath, "MSBuild", "15.0", "Bin", "MSBuild.exe");

    const mock = this.sinon.mock(fs);
    mock.expects("statSync").withArgs(vsEnterprisePath).throws();
    mock.expects("statSync").withArgs(vsProfessionalPath).returns({});

    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x86" });

    expect(result).to.be.equal(expectedResult);
  });

  it("should use visual studio community msbuild 15 on windows with visual studio 2017 project and visual studio community installed", function () {
    const toolsVersion = 15.0;
    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const vsEnterprisePath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Enterprise");
    const vsProfessionalPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Professional");
    const vsCommunityPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Community");
    const expectedResult = path.join(vsCommunityPath, "MSBuild", "15.0", "Bin", "MSBuild.exe");

    const mock = this.sinon.mock(fs);
    mock.expects("statSync").withArgs(vsEnterprisePath).throws();
    mock.expects("statSync").withArgs(vsProfessionalPath).throws();
    mock.expects("statSync").withArgs(vsCommunityPath).returns({});

    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x86" });

    expect(result).to.be.equal(expectedResult);
  });

  it("should use visual studio build tools msbuild 15 on windows with visual studio 2017 project and visual studio build tools installed", function () {
    const toolsVersion = 15.0;
    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const vsEnterprisePath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Enterprise");
    const vsProfessionalPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Professional");
    const vsCommunityPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Community");
    const vsBuildToolsPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "BuildTools");
    const expectedResult = path.join(vsBuildToolsPath, "MSBuild", "15.0", "Bin", "MSBuild.exe");

    const mock = this.sinon.mock(fs);
    mock.expects("statSync").withArgs(vsEnterprisePath).throws();
    mock.expects("statSync").withArgs(vsProfessionalPath).throws();
    mock.expects("statSync").withArgs(vsCommunityPath).throws();
    mock.expects("statSync").withArgs(vsBuildToolsPath).returns({});

    const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x86" });

    expect(result).to.be.equal(expectedResult);
  });

  it("should fall back to legacy build path on windows with visual studio 2017 project and visual studio is not installed", function () {
    const toolsVersion = 15.0;
    const expectMSBuildVersion = constants.MSBUILD_VERSIONS[toolsVersion];

    const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
    const vsEnterprisePath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Enterprise");
    const vsProfessionalPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Professional");
    const vsCommunityPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Community");
    const vsBuildToolsPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "BuildTools");
    const expectedResult = path.join(pathRoot, "MSBuild", "15.0", "Bin", "MSBuild.exe");

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

    expect(result).to.be.equal(expectedResult);
  });

  describe(`should find version 16 from vs2019, when present`, () => {
    // part of handling versions > 15 is allowing auto-detection of what is present
    //  as such, there"s too much to easily mock this out and these tests
    //  will only apply if the host has vs2019 installed
    const found = msbuildFinderSpec.msBuildFromWhere("C:/Program Files (x86)");
    const year = found.split(path.sep)
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
    )
      ;
    }
  });

  it("should throw error with invalid toolsVersion", function () {
    const func = function () {
      return msbuildFinderSpec.find({ platform: "win32", toolsVersion: -1 });
    };

    expect(func).to.throw(/No or invalid MSBuild version was supplied!/);
  });

  describe("when toolsVersion is \"auto\"", function () {
    const fs = require("fs");
    let mock;

    before(function () {
      process.env["ProgramFiles"] = path.join("C:", "Program Files");
    });

    it("should fall back to 4.0 when Visual Studio 2013 and 2015 are not installed", function () {
      const windir = "WINDIR";
      const toolsVersion = "auto";

      const expectMSBuildVersion = constants.MSBUILD_VERSIONS[4.0];
      const expectedResult = path.join(windir, "Microsoft.Net", "Framework", expectMSBuildVersion, "MSBuild.exe");

      mock = this.sinon.mock(fs);
      mock.expects("statSync").throws();

      const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, windir: windir });

      expect(result).to.be.equal(expectedResult);
    });

    it("should fall back to 4.0 when MSBuild dir exists in Program Files, but no versions installed", function () {
      const windir = "WINDIR";
      const toolsVersion = "auto";
      const expectMSBuildVersion = constants.MSBUILD_VERSIONS[4.0];
      const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
      const msbuildDir = path.join(pathRoot, "MSBuild");
      const vsEnterprisePath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Enterprise");
      const vsProfessionalPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Professional");
      const vsCommunityPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "Community");
      const vsBuildToolsPath = path.join(pathRoot, "Microsoft Visual Studio", "2017", "BuildTools");
      var expectedResult = path.join(windir, "Microsoft.Net", "Framework", expectMSBuildVersion, "MSBuild.exe");

      mock = this.sinon.mock(fs);

      var mock = this.sinon.mock(fs);
      mock.expects("statSync").withArgs(vsEnterprisePath).throws();
      mock.expects("statSync").withArgs(vsProfessionalPath).throws();
      mock.expects("statSync").withArgs(vsCommunityPath).throws();
      mock.expects("statSync").withArgs(vsBuildToolsPath).throws();
      mock.expects("statSync").returns({});
      mock.expects("readdirSync").withArgs(msbuildDir).returns([ "padding", "dir" ]);

      const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, windir: windir });

      expect(result).to.be.equal(expectedResult);
    });

    it("should use msbuild 14 on windows with visual studio 2015 project", function () {
      const toolsVersion = "auto";
      const expectMSBuildVersion = constants.MSBUILD_VERSIONS[14.0];
      const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
      const msbuildDir = path.join(pathRoot, "MSBuild");
      const expectedResult = path.join(pathRoot, "MSBuild", expectMSBuildVersion, "Bin", "MSBuild.exe");

      mock = this.sinon.mock(fs);
      mock.expects("readdirSync").withArgs(msbuildDir).returns([ "padding", "dir", "14.0" ]);
      mock.expects("statSync").withArgs(msbuildDir).returns({});
      mock.expects("statSync").withArgs(path.join(msbuildDir, "14.0", "Bin")).returns({});

      const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x86" });

      expect(result).to.be.equal(expectedResult);
    });

    it("should use msbuild 12 on windows with visual studio 2013 project and an incomplete visual studio 2015 install", function () {
      const toolsVersion = "auto";
      const expectMSBuildVersion = constants.MSBUILD_VERSIONS[12.0];
      const pathRoot = process.env["ProgramFiles"] || path.join("C:", "Program Files");
      const msbuildDir = path.join(pathRoot, "MSBuild");
      const expectedResult = path.join(pathRoot, "MSBuild", expectMSBuildVersion, "Bin", "MSBuild.exe");

      mock = this.sinon.mock(fs);
      mock.expects("readdirSync").withArgs(msbuildDir).returns([ "padding", "dir", "12.0", "14.0", "15.0" ]);
      mock.expects("statSync").withArgs(msbuildDir).returns({});
      mock.expects("statSync").withArgs(path.join(msbuildDir, "12.0", "Bin")).returns({});
      mock.expects("statSync").withArgs(path.join(msbuildDir, "14.0", "Bin")).throws();
      mock.expects("statSync").withArgs(path.join(msbuildDir, "15.0", "Bin")).throws();

      const result = msbuildFinderSpec.find({ platform: "win32", toolsVersion: toolsVersion, architecture: "x86" });

      expect(result).to.be.equal(expectedResult);
    });

    afterEach(function () {
      mock.restore();
    });
  });
});
