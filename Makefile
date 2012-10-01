build:
	uglifyjs jst.js > jst-`grep @version jst.js | sed 's/ \* @version //'`.min.js

doc:
	cat jst.js | grep "^\ \+\*\ *" | sed 's| \+\* \?||' | sed 's|^/||' | grep -v '^@' > README.mkd
