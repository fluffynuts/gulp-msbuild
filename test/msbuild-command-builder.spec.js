/*global describe, it, beforeEach*/
"use strict";

const chai = require(`chai`),
  constants = require(`../lib/constants`),
  expect = chai.expect;

chai.use(require(`sinon-chai`));
require(`mocha-sinon`);

const commandBuilder = require(`../lib/msbuild-command-builder`);
const msbuildFinder = require(`../lib/msbuild-finder`);

let defaults;

describe(`msbuild-command-builder`, function () {

  beforeEach(function () {
    defaults = JSON.parse(JSON.stringify(constants.DEFAULTS));

    this.sinon.stub(console, `log`);
  });

  describe(`buildArguments`, function () {
    it(`should build arguments with default options`, function () {
      const result = commandBuilder.buildArguments(defaults);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`should build arguments without nologo`, function () {
      const options = defaults;
      options.nologo = undefined;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`should build arguments with maxcpucount by default`, function () {
      const options = defaults;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`should fallback to 4.0 when toolsVersion is auto`, function () {
      const options = defaults;
      options.toolsVersion = `auto`;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`does omit toolsVersion parameter when it is undefined`, function () {
      const options = defaults;
      options.toolsVersion = undefined;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/nologo`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`does omit toolsVersion parameter when it is null`, function () {
      const options = defaults;
      options.toolsVersion = null;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/nologo`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`should build arguments with maxcpucount equal zero`, function () {
      const options = defaults;
      options.maxcpucount = 0;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`should build arguments with positive maxcpucount`, function () {
      const options = defaults;
      options.maxcpucount = 4;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount:4`, `/property:Configuration=Release`]);
    });

    it(`should build arguments with negative maxcpucount`, function () {
      const options = defaults;
      options.maxcpucount = -1;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/property:Configuration=Release`]);
    });

    it(`should build arguments excluding maxcpucount when using xbuild`, function () {
      const options = defaults;
      options.maxcpucount = 4;
      options.msbuildPath = `xbuild`;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/property:Configuration=Release`]);
    });

    it(`should build arguments with custom properties`, function () {
      const options = defaults;
      options.properties = { WarningLevel: 2 };
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Configuration=Release`, `/property:WarningLevel=2`]);
    });

    it(`should add Configuration Property when Configuration-Option is specified`, function () {
      const options = defaults;
      options.configuration = `Debug`;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Configuration=Debug`]);
    });

    it(`should use Configuration Property in the custom properties list when specified`, function () {
      const options = defaults;
      options.properties = { Configuration: `Debug` };
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Configuration=Debug`]);
    });

    it(`should add SolutionPlatform Property when SolutionPlatform-Option is specified`, function () {
      const options = defaults;
      options.solutionPlatform = `AnyCPU`;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Platform=AnyCPU`, `/property:Configuration=Release`]);
    });

    it(`should use SolutionPlatform Property in the custom properties list when specified`, function () {
      const options = defaults;
      options.solutionPlatform = `AnyCPU`;
      options.properties = { Platform: `x86` };
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Platform=x86`, `/property:Configuration=Release`]);
    });

    it(`should use fileLoggerParameters when specified`, function () {
      const options = defaults;
      options.fileLoggerParameters = `LogFile=Build.log`;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/flp:LogFile=Build.log`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`should use consoleLoggerParameters when specified`, function () {
      const options = defaults;
      options.consoleLoggerParameters = `Verbosity=minimal`;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/clp:Verbosity=minimal`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`should use loggerParameters when specified`, function () {
      const options = defaults;
      options.loggerParameters = `XMLLogger,./MyLogger.dll;OutputAsHTML`;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/logger:XMLLogger,./MyLogger.dll;OutputAsHTML`, `/maxcpucount`, `/property:Configuration=Release`]);
    });

    it(`should build arguments /nodeReuse:False when specified`, function () {
      const options = defaults;
      options.nodeReuse = false;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/nodeReuse:False`, `/property:Configuration=Release`]);
    });

    it(`should add publish properties when emitPublishedFiles is true`, function () {
      const options = defaults;
      options.emitPublishedFiles = true;
      options.publishDirectory = `dummy`;
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:DeployOnBuild=true`, `/property:DeployDefaultTarget=WebPublish`, `/property:WebPublishMethod=FileSystem`, `/property:DeleteExistingFiles=true`, `/property:_FindDependencies=true`, `/property:PublishUrl=dummy`, `/property:Configuration=Release`]);
    });
  });



  describe(`construct`, function () {
    it(`should fail with no options`, function () {
      const func = function () {
        return commandBuilder.construct({}, {});
      };

      expect(func).to.be.throw(`No options specified!`);
    });

    it(`should find msbuild when not specified`, function () {
      this.sinon.stub(msbuildFinder, `find`).returns(``);

      commandBuilder.construct({}, defaults);

      expect(msbuildFinder.find).to.have.been.calledWith(defaults);
    });

    it(`should use msbuildpath if specified`, function () {
      this.sinon.stub(msbuildFinder, `find`);

      const options = defaults;
      options.msbuildPath = `here`;
      const command = commandBuilder.construct({}, options);

      expect(msbuildFinder.find).to.not.have.been.calledWith(options);
      expect(command.executable).to.equal(`here`);
    });

    it(`should construct a valid command`, function () {
      const options = defaults;
      options.msbuildPath = `here`;
      const command = commandBuilder.construct({ path: `test.sln` }, options);

      expect(command.executable).to.equal(`here`);
      expect(command.args).to.contain(`test.sln`);
    });

    it(`should include arguments passed by customArgs`, function () {
      const options = defaults;
      options.customArgs = [`/custom1`, `/custom2`];
      const result = commandBuilder.buildArguments(options);

      expect(result).to.deep.equal([`/target:Rebuild`, `/verbosity:normal`, `/toolsversion:4.0`, `/nologo`, `/maxcpucount`, `/property:Configuration=Release`, `/custom1`, `/custom2`]);
    });

    it(`should parse templates in consoleLoggerParameters, fileLoggerParameters and loggerParameters when specified`, function () {
      const options = defaults;
      options.consoleLoggerParameters = `<%= (file.path === "test.sln") ? "ErrorsOnly" : "WarningsOnly" %>`;
      options.fileLoggerParameters = `LogFile=<%= file.path %>.log`;
      options.loggerParameters = `XMLLogger,<%= (file.path === "test.sln") ? "./TestLogger.dll" : "./MyLogger.dll" %>;OutputAsHTML`;
      const command = commandBuilder.construct({ path: `test.sln` }, options);

      expect(command.args).to.contain(`/clp:ErrorsOnly`);
      expect(command.args).to.contain(`/flp:LogFile=test.sln.log`);
      expect(command.args).to.contain(`/logger:XMLLogger,./TestLogger.dll;OutputAsHTML`);
    });

    it(`should parse templates in properties`, function () {
      const options = defaults;
      options.properties = { someProp: `<%= file.path %>`, anotherProp: `noTemplate` };
      options.msbuildPath = `here`;
      const command = commandBuilder.construct({ path: `test.sln` }, options);

      expect(command.args).to.contain(`/property:someProp=test.sln`);
      expect(command.args).to.contain(`/property:anotherProp=noTemplate`);
    });
  });
});
