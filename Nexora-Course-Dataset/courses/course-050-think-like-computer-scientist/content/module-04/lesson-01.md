# Classes and functions

> Source: How to Think Like a Computer Scientist: Learning with Python. Allen Downey, Jeffrey Elkner, Chris Meyers.
> Official URL: https://www.greenteapress.com/thinkpython/thinkCSpy/html/chap13.html
> License: CC BY
> Reused without endorsement. Original copyright notices retained.

This is an older version of the book now known as _Think Python_. You might prefer to [read a more recent version](<http://greenteapress.com/wp/think-python-2e/>).   
  
* * *

| [![Previous](images/prev.png)](<chap12.html>) | [![Up](images/up.png)](<index.html>) | [![Next](images/next.png)](<chap14.html>) | How to Think Like a Computer Scientist | [![Index](images/index.png)](<dex.html>)  
---|---|---|---|---  
  
* * *

## Chapter 13

# Classes and functions

### 13.1 Time

As another example of a user-defined type, we'll define a class called `Time` that records the time of day. The class definition looks like this: 

`class Time:   
pass   
`

We can create a new `Time` object and assign attributes for hours, minutes, and seconds: 

`time = Time()   
time.hours = 11   
time.minutes = 59   
time.seconds = 30   
`

The state diagram for the `Time` object looks like this: 

![](illustrations/time.png)

> _As an exercise, write a function` printTime` that takes a `Time` object as an argument and prints it in the form `hours:minutes:seconds`._

> _As a second exercise, write a boolean function` after` that takes two `Time` objects, `t1` and `t2`, as arguments, and returns `True` if `t1` follows `t2` chronologically and `False` otherwise._

### 13.2 Pure functions

In the next few sections, we'll write two versions of a function called `addTime`, which calculates the sum of two `Time`s. They will demonstrate two kinds of functions: pure functions and modifiers. 

The following is a rough version of `addTime`: 

`def addTime(t1, t2):   
sum = Time()   
sum.hours = t1.hours + t2.hours   
sum.minutes = t1.minutes + t2.minutes   
sum.seconds = t1.seconds + t2.seconds   
return sum   
`

The function creates a new `Time` object, initializes its attributes, and returns a reference to the new object. This is called a **pure function** because it does not modify any of the objects passed to it as arguments and it has no side effects, such as displaying a value or getting user input. 

Here is an example of how to use this function. We'll create two `Time` objects: `currentTime`, which contains the current time; and `breadTime`, which contains the amount of time it takes for a breadmaker to make bread. Then we'll use `addTime` to figure out when the bread will be done. If you haven't finished writing `printTime` yet, take a look ahead to [Section 14.2](<chap14.html#2>) before you try this: 

`>>> currentTime = Time()   
>>> currentTime.hours = 9   
>>> currentTime.minutes = 14   
>>> currentTime.seconds = 30   
  
>>> breadTime = Time()   
>>> breadTime.hours = 3   
>>> breadTime.minutes = 35   
>>> breadTime.seconds = 0   
  
>>> doneTime = addTime(currentTime, breadTime)   
>>> printTime(doneTime)   
`

The output of this program is `12:49:30`, which is correct. On the other hand, there are cases where the result is not correct. Can you think of one? 

The problem is that this function does not deal with cases where the number of seconds or minutes adds up to more than sixty. When that happens, we have to "carry" the extra seconds into the minutes column or the extra minutes into the hours column. 

Here's a second corrected version of the function: 

`def addTime(t1, t2):   
sum = Time()   
sum.hours = t1.hours + t2.hours   
sum.minutes = t1.minutes + t2.minutes   
sum.seconds = t1.seconds + t2.seconds   
  
if sum.seconds >= 60:   
sum.seconds = sum.seconds - 60   
sum.minutes = sum.minutes + 1   
  
if sum.minutes >= 60:   
sum.minutes = sum.minutes - 60   
sum.hours = sum.hours + 1   
  
return sum   
`

Although this function is correct, it is starting to get big. Later we will suggest an alternative approach that yields shorter code. 

### 13.3 Modifiers

There are times when it is useful for a function to modify one or more of the objects it gets as arguments. Usually, the caller keeps a reference to the objects it passes, so any changes the function makes are visible to the caller. Functions that work this way are called **modifiers**. 

`increment`, which adds a given number of seconds to a `Time` object, would be written most naturally as a modifier. A rough draft of the function looks like this: 

`def increment(time, seconds):   
time.seconds = time.seconds + seconds   
  
if time.seconds >= 60:   
time.seconds = time.seconds - 60   
time.minutes = time.minutes + 1   
  
if time.minutes >= 60:   
time.minutes = time.minutes - 60   
time.hours = time.hours + 1   
`

The first line performs the basic operation; the remainder deals with the special cases we saw before. 

Is this function correct? What happens if the parameter `seconds` is much greater than sixty? In that case, it is not enough to carry once; we have to keep doing it until `seconds` is less than sixty. One solution is to replace the `if` statements with `while` statements: 

`def increment(time, seconds):   
time.seconds = time.seconds + seconds   
  
while time.seconds >= 60:   
time.seconds = time.seconds - 60   
time.minutes = time.minutes + 1   
  
while time.minutes >= 60:   
time.minutes = time.minutes - 60   
time.hours = time.hours + 1   
`

This function is now correct, but it is not the most efficient solution. 

> _As an exercise, rewrite this function so that it doesn't contain any loops._

> _As a second exercise, rewrite` increment` as a pure function, and write function calls to both versions._

### 13.4 Which is better?

Anything that can be done with modifiers can also be done with pure functions. In fact, some programming languages only allow pure functions. There is some evidence that programs that use pure functions are faster to develop and less error-prone than programs that use modifiers. Nevertheless, modifiers are convenient at times, and in some cases, functional programs are less efficient. 

In general, we recommend that you write pure functions whenever it is reasonable to do so and resort to modifiers only if there is a compelling advantage. This approach might be called a **functional programming style**. 

### 13.5 Prototype development versus planning

In this chapter, we demonstrated an approach to program development that we call **prototype development**. In each case, we wrote a rough draft (or prototype) that performed the basic calculation and then tested it on a few cases, correcting flaws as we found them. 

Although this approach can be effective, it can lead to code that is unnecessarily complicated ~~~~ since it deals with many special cases ~~~~ and unreliable ~~~~ since it is hard to know if you have found all the errors. 

An alternative is **planned development** , in which high-level insight into the problem can make the programming much easier. In this case, the insight is that a `Time` object is really a three-digit number in base 60! The `second` component is the "ones column," the `minute` component is the "sixties column," and the `hour` component is the "thirty-six hundreds column." 

When we wrote `addTime` and `increment`, we were effectively doing addition in base 60, which is why we had to carry from one column to the next. 

This observation suggests another approach to the whole problem ~~~~ we can convert a `Time` object into a single number and take advantage of the fact that the computer knows how to do arithmetic with numbers. The following function converts a `Time` object into an integer: 

`def convertToSeconds(t):   
minutes = t.hours * 60 + t.minutes   
seconds = minutes * 60 + t.seconds   
return seconds   
`

Now, all we need is a way to convert from an integer to a `Time` object: 

`def makeTime(seconds):   
time = Time()   
time.hours = seconds // 3600   
time.minutes = (seconds%3600) // 60   
time.seconds = seconds%60   
return time   
`

You might have to think a bit to convince yourself that this function is correct. Assuming you are convinced, you can use it and `convertToSeconds` to rewrite `addTime`: 

`def addTime(t1, t2):   
seconds = convertToSeconds(t1) + convertToSeconds(t2)   
return makeTime(seconds)   
`

This version is much shorter than the original, and it is much easier to demonstrate that it is correct. 

> _As an exercise, rewrite` increment` the same way._

### 13.6 Generalization

In some ways, converting from base 60 to base 10 and back is harder than just dealing with times. Base conversion is more abstract; our intuition for dealing with times is better. 

But if we have the insight to treat times as base 60 numbers and make the investment of writing the conversion functions (`convertToSeconds` and `makeTime`), we get a program that is shorter, easier to read and debug, and more reliable. 

It is also easier to add features later. For example, imagine subtracting two `Time`s to find the duration between them. The naïve approach would be to implement subtraction with borrowing. Using the conversion functions would be easier and more likely to be correct. 

Ironically, sometimes making a problem harder (or more general) makes it easier (because there are fewer special cases and fewer opportunities for error). 

### 13.7 Algorithms

When you write a general solution for a class of problems, as opposed to a specific solution to a single problem, you have written an **algorithm**. We mentioned this word before but did not define it carefully. It is not easy to define, so we will try a couple of approaches. 

First, consider something that is not an algorithm. When you learned to multiply single-digit numbers, you probably memorized the multiplication table. In effect, you memorized 100 specific solutions. That kind of knowledge is not algorithmic. 

But if you were "lazy," you probably cheated by learning a few tricks. For example, to find the product of `n` and 9, you can write `n-1` as the first digit and `10-n` as the second digit. This trick is a general solution for multiplying any single-digit number by 9. That's an algorithm! 

Similarly, the techniques you learned for addition with carrying, subtraction with borrowing, and long division are all algorithms. One of the characteristics of algorithms is that they do not require any intelligence to carry out. They are mechanical processes in which each step follows from the last according to a simple set of rules. 

In our opinion, it is embarrassing that humans spend so much time in school learning to execute algorithms that, quite literally, require no intelligence. 

On the other hand, the process of designing algorithms is interesting, intellectually challenging, and a central part of what we call programming. 

Some of the things that people do naturally, without difficulty or conscious thought, are the hardest to express algorithmically. Understanding natural language is a good example. We all do it, but so far no one has been able to explain _how_ we do it, at least not in the form of an algorithm. 

### 13.8 Glossary

pure function
    A function that does not modify any of the objects it receives as arguments. Most pure functions are fruitful.
modifier
    A function that changes one or more of the objects it receives as arguments. Most modifiers are fruitless.
functional programming style
    A style of program design in which the majority of functions are pure.
prototype development
    A way of developing programs starting with a prototype and gradually testing and improving it.
planned development
    A way of developing programs that involves high-level insight into the problem and more planning than incremental development or prototype development.
algorithm
    A set of instructions for solving a class of problems by a mechanical, unintelligent process.

This is an older version of the book now known as _Think Python_. You might prefer to [read a more recent version](<http://greenteapress.com/wp/think-python-2e/>). 

* * *

[![Previous](images/prev.png)](<chap12.html>) | [![Up](images/up.png)](<index.html>) | [![Next](images/next.png)](<chap14.html>) | How to Think Like a Computer Scientist | [![Index](images/index.png)](<dex.html>)  
---|---|---|---|---  
  
* * *

