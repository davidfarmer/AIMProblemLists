#!/bin/sh

jison lib/grammar.jison && node grammar.js $@ > 1.json
