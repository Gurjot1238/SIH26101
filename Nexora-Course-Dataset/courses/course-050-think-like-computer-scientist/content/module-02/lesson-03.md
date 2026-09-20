# Strings

> Source: How to Think Like a Computer Scientist: Learning with Python. Allen Downey, Jeffrey Elkner, Chris Meyers.
> Official URL: https://www.greenteapress.com/thinkpython/thinkCSpy/html/chap07.html
> License: CC BY
> Reused without endorsement. Original copyright notices retained.

This is an older version of the book now known as _Think Python_. You might prefer to [read a more recent version](<http://greenteapress.com/wp/think-python-2e/>).   
  
* * *

| [![Previous](images/prev.png)](<chap06.html>) | [![Up](images/up.png)](<index.html>) | [![Next](images/next.png)](<chap08.html>) | How to Think Like a Computer Scientist | [![Index](images/index.png)](<dex.html>)  
---|---|---|---|---  
  
* * *

## Chapter 7

# Strings

### 7.1 A compound data type

So far we have seen three types: `int`, `float`, and `string`. Strings are qualitatively different from the other two because they are made up of smaller pieces ~~~~ characters. 

Types that comprise smaller pieces are called **compound data types**. Depending on what we are doing, we may want to treat a compound data type as a single thing, or we may want to access its parts. This ambiguity is useful. 

The bracket operator selects a single character from a string. 

`>>> fruit = "banana"   
>>> letter = fruit[1]   
>>> print letter   
`

The expression `fruit[1]` selects character number 1 from `fruit`. The variable `letter` refers to the result. When we display `letter`, we get a surprise: 

`a   
`

The first letter of `"banana"` is not `a`. Unless you are a computer scientist. In that case you should think of the expression in brackets as an offset from the beginning of the string, and the offset of the first letter is zero. So `b` is the 0th letter ("zero-eth") of `"banana"`, `a` is the 1th letter ("one-eth"), and `n` is the 2th ("two-eth") letter. 

To get the first letter of a string, you just put 0, or any expression with the value 0, in the brackets: 

`>>> letter = fruit[0]   
>>> print letter   
b   
`

The expression in brackets is called an **index**. An index specifies a member of an ordered set, in this case the set of characters in the string. The index _indicates_ which one you want, hence the name. It can be any integer expression. 

### 7.2 Length

The `len` function returns the number of characters in a string: 

`>>> fruit = "banana"   
>>> len(fruit)   
6   
`

To get the last letter of a string, you might be tempted to try something like this: 

`length = len(fruit)   
last = fruit[length] # ERROR!   
`

That won't work. It causes the runtime error `IndexError: string   
index out of range`. The reason is that there is no 6th letter in `"banana"`. Since we started counting at zero, the six letters are numbered 0 to 5. To get the last character, we have to subtract 1 from `length`: 

`length = len(fruit)   
last = fruit[length-1]   
`

Alternatively, we can use negative indices, which count backward from the end of the string. The expression `fruit[-1]` yields the last letter, `fruit[-2]` yields the second to last, and so on. 

### 7.3 Traversal and the `for` loop

A lot of computations involve processing a string one character at a time. Often they start at the beginning, select each character in turn, do something to it, and continue until the end. This pattern of processing is called a **traversal**. One way to encode a traversal is with a `while` statement: 

`index = 0   
while index < len(fruit):   
letter = fruit[index]   
print letter   
index = index + 1   
`

This loop traverses the string and displays each letter on a line by itself. The loop condition is `index < len(fruit)`, so when `index` is equal to the length of the string, the condition is false, and the body of the loop is not executed. The last character accessed is the one with the index `len(fruit)-1`, which is the last character in the string. 

> _As an exercise, write a function that takes a string as an argument and outputs the letters backward, one per line._

Using an index to traverse a set of values is so common that Python provides an alternative, simpler syntax ~~~~ the `for` loop: 

`for char in fruit:   
print char   
`

Each time through the loop, the next character in the string is assigned to the variable `char`. The loop continues until no characters are left. 

The following example shows how to use concatenation and a `for` loop to generate an abecedarian series. "Abecedarian" refers to a series or list in which the elements appear in alphabetical order. For example, in Robert McCloskey's book _Make Way for Ducklings_ , the names of the ducklings are Jack, Kack, Lack, Mack, Nack, Ouack, Pack, and Quack. This loop outputs these names in order: 

`prefixes = "JKLMNOPQ"   
suffix = "ack"   
  
for letter in prefixes:   
print letter + suffix   
`

The output of this program is: 

`Jack   
Kack   
Lack   
Mack   
Nack   
Oack   
Pack   
Qack   
`

Of course, that's not quite right because "Ouack" and "Quack" are misspelled. 

> _As an exercise, modify the program to fix this error._

### 7.4 String slices

A segment of a string is called a **slice**. Selecting a slice is similar to selecting a character: 

`>>> s = "Peter, Paul, and Mary"   
>>> print s[0:5]   
Peter   
>>> print s[7:11]   
Paul   
>>> print s[17:21]   
Mary   
`

The operator `[n:m]` returns the part of the string from the "n-eth" character to the "m-eth" character, including the first but excluding the last. This behavior is counterintuitive; it makes more sense if you imagine the indices pointing _between_ the characters, as in the following diagram: 

![](illustrations/banana.png)

If you omit the first index (before the colon), the slice starts at the beginning of the string. If you omit the second index, the slice goes to the end of the string. Thus: 

`>>> fruit = "banana"   
>>> fruit[:3]   
'ban'   
>>> fruit[3:]   
'ana'   
`

What do you think `s[:]` means? 

### 7.5 String comparison

The comparison operators work on strings. To see if two strings are equal: 

`if word == "banana":   
print "Yes, we have no bananas!"   
`

Other comparison operations are useful for putting words in alphabetical order: 

`if word < "banana":   
print "Your word," + word + ", comes before banana."   
elif word > "banana":   
print "Your word," + word + ", comes after banana."   
else:   
print "Yes, we have no bananas!"   
`

You should be aware, though, that Python does not handle upper- and lowercase letters the same way that people do. All the uppercase letters come before all the lowercase letters. As a result: 

`Your word, Zebra, comes before banana.   
`

A common way to address this problem is to convert strings to a standard format, such as all lowercase, before performing the comparison. A more difficult problem is making the program realize that zebras are not fruit. 

### 7.6 Strings are immutable

It is tempting to use the `[]` operator on the left side of an assignment, with the intention of changing a character in a string. For example: 

`greeting = "Hello, world!"   
greeting[0] = 'J' # ERROR!   
print greeting   
`

Instead of producing the output `Jello, world!`, this code produces the runtime error `TypeError: object doesn't support item   
assignment`. 

Strings are **immutable** , which means you can't change an existing string. The best you can do is create a new string that is a variation on the original: 

`greeting = "Hello, world!"   
newGreeting = 'J' + greeting[1:]   
print newGreeting   
`

The solution here is to concatenate a new first letter onto a slice of `greeting`. This operation has no effect on the original string. 

### 7.7 A `find` function

What does the following function do? 

`def find(str, ch):   
index = 0   
while index < len(str):   
if str[index] == ch:   
return index   
index = index + 1   
return -1   
`

In a sense, `find` is the opposite of the `[]` operator. Instead of taking an index and extracting the corresponding character, it takes a character and finds the index where that character appears. If the character is not found, the function returns `-1`. 

This is the first example we have seen of a `return` statement inside a loop. If `str[index] == ch`, the function returns immediately, breaking out of the loop prematurely. 

If the character doesn't appear in the string, then the program exits the loop normally and returns `-1`. 

This pattern of computation is sometimes called a "eureka" traversal because as soon as we find what we are looking for, we can cry "Eureka!" and stop looking. 

> _As an exercise, modify the` find` function so that it has a third parameter, the index in the string where it should start looking._

### 7.8 Looping and counting

The following program counts the number of times the letter `a` appears in a string: 

`fruit = "banana"   
count = 0   
for char in fruit:   
if char == 'a':   
count = count + 1   
print count   
`

This program demonstrates another pattern of computation called a **counter**. The variable `count` is initialized to 0 and then incremented each time an `a` is found. (To **increment** is to increase by one; it is the opposite of **decrement** , and unrelated to "excrement," which is a noun.) When the loop exits, `count` contains the result ~~~~ the total number of `a`'s. 

> _As an exercise, encapsulate this code in a function named` countLetters`, and generalize it so that it accepts the string and the letter as arguments._

> _As a second exercise, rewrite this function so that instead of traversing the string, it uses the three-parameter version of` find` from the previous._

### 7.9 The `string` module

The `string` module contains useful functions that manipulate strings. As usual, we have to import the module before we can use it: 

`>>> import string   
`

The `string` module includes a function named `find` that does the same thing as the function we wrote. To call it we have to specify the name of the module and the name of the function using dot notation. 

`>>> fruit = "banana"   
>>> index = string.find(fruit, "a")   
>>> print index   
1   
`

This example demonstrates one of the benefits of modules ~~~~ they help avoid collisions between the names of built-in functions and user-defined functions. By using dot notation we can specify which version of `find` we want. 

Actually, `string.find` is more general than our version. First, it can find substrings, not just characters: 

`>>> string.find("banana", "na")   
2   
`

Also, it takes an additional argument that specifies the index it should start at: 

`>>> string.find("banana", "na", 3)   
4   
`

Or it can take two additional arguments that specify a range of indices: 

`>>> string.find("bob", "b", 1, 2)   
-1   
`

In this example, the search fails because the letter _b_ does not appear in the index range from `1` to `2` (not including `2`). 

### 7.10 Character classification

It is often helpful to examine a character and test whether it is upper- or lowercase, or whether it is a character or a digit. The `string` module provides several constants that are useful for these purposes. 

The string `string.lowercase` contains all of the letters that the system considers to be lowercase. Similarly, `string.uppercase` contains all of the uppercase letters. Try the following and see what you get: 

`>>> print string.lowercase   
>>> print string.uppercase   
>>> print string.digits   
`

We can use these constants and `find` to classify characters. For example, if `find(lowercase, ch)` returns a value other than `-1`, then `ch` must be lowercase: 

`def isLower(ch):   
return string.find(string.lowercase, ch) != -1   
`

Alternatively, we can take advantage of the `in` operator, which determines whether a character appears in a string: 

`def isLower(ch):   
return ch in string.lowercase   
`

As yet another alternative, we can use the comparison operator: 

`def isLower(ch):   
return 'a' <= ch <= 'z'   
`

If `ch` is between _a_ and _z_ , it must be a lowercase letter. 

> _As an exercise, discuss which version of` isLower` you think will be fastest. Can you think of other reasons besides speed to prefer one or the other?_

Another constant defined in the `string` module may surprise you when you print it: 

`>>> print string.whitespace   
`

**Whitespace** characters move the cursor without printing anything. They create the white space between visible characters (at least on white paper). The constant `string.whitespace` contains all the whitespace characters, including space, tab (`\t`), and newline (`\n`). 

There are other useful functions in the `string` module, but this book isn't intended to be a reference manual. On the other hand, the _Python Library Reference_ is. Along with a wealth of other documentation, it's available from the Python website, [www.python.org](<http://www.python.org>). 

### 7.11 Glossary

compound data type
    A data type in which the values are made up of components, or elements, that are themselves values.
traverse
    To iterate through the elements of a set, performing a similar operation on each.
index
    A variable or value used to select a member of an ordered set, such as a character from a string.
slice
    A part of a string specified by a range of indices.
mutable
    A compound data types whose elements can be assigned new values.
counter
    A variable used to count something, usually initialized to zero and then incremented.
increment
    To increase the value of a variable by one.
decrement
    To decrease the value of a variable by one.
whitespace
    Any of the characters that move the cursor without printing visible characters. The constant `string.whitespace` contains all the whitespace characters.

This is an older version of the book now known as _Think Python_. You might prefer to [read a more recent version](<http://greenteapress.com/wp/think-python-2e/>). 

* * *

[![Previous](images/prev.png)](<chap06.html>) | [![Up](images/up.png)](<index.html>) | [![Next](images/next.png)](<chap08.html>) | How to Think Like a Computer Scientist | [![Index](images/index.png)](<dex.html>)  
---|---|---|---|---  
  
* * *

