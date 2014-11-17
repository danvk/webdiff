module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    qunit: {
      files: ['tests/runner.html']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-qunit');

  // Task to run tests
  grunt.registerTask('test', 'qunit');
};
