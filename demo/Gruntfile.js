'use strict';

module.exports = function(grunt) {

  // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        notify: {
            shell: {
                options:{
                    message: "PHP2HTML"
                }
            }
            
        },
        less: {
            development:{
                files:{
                    'css/body.css': 'css/body.less'
                }
            }
        },
        cssmin: {
            options: {

            },
            build: {
                expand: true,
                cwd: 'css/',
                src: ['*.css', '!*.min.css'],
                dest: 'css/',
                ext: '.min.css'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle: false
            },
            build: {
                files:{
                    'js/<%= pkg.name %>.js': [
                        'js/plugins.js', 
                        'js/main.js'
                    ]
                }
            }
        },
        concat: {
            options: {
              // define a string to put between each file in the concatenated output
                separator: ';\n'
            },
            js: {
                files:{
                    'js/<%= pkg.name %>.min.js': [
                        'js/vendor/jquery-1.10.2.min.js', 
                        'js/<%= pkg.name %>.js',
                        'js/vendor/modernizr-2.6.2.min.js', 
                        'js/vendor/bootstrap.min.js', 
                    ]
                }
            },
            css: {
            // the files to concatenate
                files:{
                    'css/<%= pkg.name %>.min.css':[
//                        'css/normalize.min.css',
                        'css/main.min.css',
                        'css/bootstrap.min.css'
//                        'css/body.min.css'
                    ]
                }
            }
        }, 
        clean: {
            build: [
                'css/<%= pkg.name %>.min.css',
            ],
            finish: [
                'css/bootstrap-theme.min.css',
                'css/bootstrap.min.css',
                'css/main.min.css',
                'css/normalize.min.css',
                'js/<%= pkg.name %>.js'
            ]
        },
        shell: {
            options:{
                title: "PHP2HTML"
            },
            php2html:{
                command: "cd php && chmod +x php2html.sh && ./php2html.sh"
            }
        },
        watch: {
            php: {
                files: ['php/*.php'],
                tasks: ['notify', 'shell:php2html']
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
//    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task(s).
    grunt.registerTask('default', ['notify', 'clean:build', 'less', 'cssmin', 'uglify', 'concat', 'clean:finish', 'shell']);

};