build:
	uglifyjs jstmpl.js > jstmpl-`grep @version jstmpl.js | sed 's/ \* @version //'`.min.js

doc:
	cat jstmpl.js | grep "^\ \+\*\ *" | sed 's| \+\* \?||' | sed 's|^/||' | grep -v '^@' > README.mkd
