# The way of the program

> Source: How to Think Like a Computer Scientist: Learning with Python. Allen Downey, Jeffrey Elkner, Chris Meyers.
> Official URL: https://www.greenteapress.com/thinkpython/thinkCSpy/html/chap01.html
> License: CC BY
> Reused without endorsement. Original copyright notices retained.

This is an older version of the book now known as _Think Python_. You might prefer to [read a more recent version](<http://greenteapress.com/wp/think-python-2e/>). 

* * *

| [![Previous](images/prev.png)](<contrib.html>) | [![Up](images/up.png)](<index.html>) | [![Next](images/next.png)](<chap02.html>) | How to Think Like a Computer Scientist | [![Index](images/index.png)](<dex.html>)  
---|---|---|---|---  
  
* * *

## Chapter 1

# The way of the program

The goal of this book is to teach you to think like a computer scientist. This way of thinking combines some of the best features of mathematics, engineering, and natural science. Like mathematicians, computer scientists use formal languages to denote ideas (specifically computations). Like engineers, they design things, assembling components into systems and evaluating tradeoffs among alternatives. Like scientists, they observe the behavior of complex systems, form hypotheses, and test predictions. 

The single most important skill for a computer scientist is **problem solving**. Problem solving means the ability to formulate problems, think creatively about solutions, and express a solution clearly and accurately. As it turns out, the process of learning to program is an excellent opportunity to practice problem-solving skills. That's why this chapter is called, "The way of the program." 

On one level, you will be learning to program, a useful skill by itself. On another level, you will use programming as a means to an end. As we go along, that end will become clearer. 

### 1.1 The Python programming language

The programming language you will be learning is Python. Python is an example of a **high-level language** ; other high-level languages you might have heard of are C, C++, Perl, and Java. 

As you might infer from the name "high-level language," there are also **low-level languages** , sometimes referred to as "machine languages" or "assembly languages." Loosely speaking, computers can only execute programs written in low-level languages. Thus, programs written in a high-level language have to be processed before they can run. This extra processing takes some time, which is a small disadvantage of high-level languages. 

But the advantages are enormous. First, it is much easier to program in a high-level language. Programs written in a high-level language take less time to write, they are shorter and easier to read, and they are more likely to be correct. Second, high-level languages are **portable** , meaning that they can run on different kinds of computers with few or no modifications. Low-level programs can run on only one kind of computer and have to be rewritten to run on another. 

Due to these advantages, almost all programs are written in high-level languages. Low-level languages are used only for a few specialized applications. 

Two kinds of programs process high-level languages into low-level languages: **interpreters** and **compilers**. An interpreter reads a high-level program and executes it, meaning that it does what the program says. It processes the program a little at a time, alternately reading lines and performing computations. 

![](illustrations/interpret.png)

A compiler reads the program and translates it completely before the program starts running. In this case, the high-level program is called the **source code** , and the translated program is called the **object code** or the **executable**. Once a program is compiled, you can execute it repeatedly without further translation. 

![](illustrations/compile.png)

Python is considered an interpreted language because Python programs are executed by an interpreter. There are two ways to use the interpreter: command-line mode and script mode. In command-line mode, you type Python programs and the interpreter prints the result: 

`$ python   
Python 2.4.1 (#1, Apr 29 2005, 00:28:56)   
Type "help", "copyright", "credits" or "license" for more information.   
>>> print 1 + 1   
2   
`

The first line of this example is the command that starts the Python interpreter. The next two lines are messages from the interpreter. The third line starts with `>>>`, which is the prompt the interpreter uses to indicate that it is ready. We typed `print 1 + 1`, and the interpreter replied `2`. 

Alternatively, you can write a program in a file and use the interpreter to execute the contents of the file. Such a file is called a **script**. For example, we used a text editor to create a file named `latoya.py` with the following contents: 

`print 1 + 1   
`

By convention, files that contain Python programs have names that end with `.py`. 

To execute the program, we have to tell the interpreter the name of the script: 

`$ python latoya.py   
2   
`

In other development environments, the details of executing programs may differ. Also, most programs are more interesting than this one. 

Most of the examples in this book are executed on the command line. Working on the command line is convenient for program development and testing, because you can type programs and execute them immediately. Once you have a working program, you should store it in a script so you can execute or modify it in the future. 

### 1.2 What is a program?

A **program** is a sequence of instructions that specifies how to perform a computation. The computation might be something mathematical, such as solving a system of equations or finding the roots of a polynomial, but it can also be a symbolic computation, such as searching and replacing text in a document or (strangely enough) compiling a program. 

The details look different in different languages, but a few basic instructions appear in just about every language: 

input
    Get data from the keyboard, a file, or some other device.
output
    Display data on the screen or send data to a file or other device.
math
    Perform basic mathematical operations like addition and multiplication.
conditional execution
    Check for certain conditions and execute the appropriate sequence of statements.
repetition
    Perform some action repeatedly, usually with some variation.

Believe it or not, that's pretty much all there is to it. Every program you've ever used, no matter how complicated, is made up of instructions that look more or less like these. Thus, we can describe programming as the process of breaking a large, complex task into smaller and smaller subtasks until the subtasks are simple enough to be performed with one of these basic instructions. 

That may be a little vague, but we will come back to this topic later when we talk about **algorithms**. 

### 1.3 What is debugging?

Programming is a complex process, and because it is done by human beings, it often leads to errors. For whimsical reasons, programming errors are called **bugs** and the process of tracking them down and correcting them is called **debugging**. 

Three kinds of errors can occur in a program: syntax errors, runtime errors, and semantic errors. It is useful to distinguish between them in order to track them down more quickly. 

#### Syntax errors

Python can only execute a program if the program is syntactically correct; otherwise, the process fails and returns an error message. **Syntax** refers to the structure of a program and the rules about that structure. For example, in English, a sentence must begin with a capital letter and end with a period. this sentence contains a **syntax error**. So does this one 

For most readers, a few syntax errors are not a significant problem, which is why we can read the poetry of e. e. cummings without spewing error messages. Python is not so forgiving. If there is a single syntax error anywhere in your program, Python will print an error message and quit, and you will not be able to run your program. During the first few weeks of your programming career, you will probably spend a lot of time tracking down syntax errors. As you gain experience, though, you will make fewer errors and find them faster. 

#### Runtime errors

The second type of error is a runtime error, so called because the error does not appear until you run the program. These errors are also called **exceptions** because they usually indicate that something exceptional (and bad) has happened. 

Runtime errors are rare in the simple programs you will see in the first few chapters, so it might be a while before you encounter one. 

#### Semantic errors

The third type of error is the **semantic error**. If there is a semantic error in your program, it will run successfully, in the sense that the computer will not generate any error messages, but it will not do the right thing. It will do something else. Specifically, it will do what you told it to do. 

The problem is that the program you wrote is not the program you wanted to write. The meaning of the program (its semantics) is wrong. Identifying semantic errors can be tricky because it requires you to work backward by looking at the output of the program and trying to figure out what it is doing. 

#### Experimental debugging

One of the most important skills you will acquire is debugging. Although it can be frustrating, debugging is one of the most intellectually rich, challenging, and interesting parts of programming. 

In some ways, debugging is like detective work. You are confronted with clues, and you have to infer the processes and events that led to the results you see. 

Debugging is also like an experimental science. Once you have an idea what is going wrong, you modify your program and try again. If your hypothesis was correct, then you can predict the result of the modification, and you take a step closer to a working program. If your hypothesis was wrong, you have to come up with a new one. As Sherlock Holmes pointed out, "When you have eliminated the impossible, whatever remains, however improbable, must be the truth." (A. Conan Doyle, _The Sign of Four_) 

For some people, programming and debugging are the same thing. That is, programming is the process of gradually debugging a program until it does what you want. The idea is that you should start with a program that does _something_ and make small modifications, debugging them as you go, so that you always have a working program. 

For example, Linux is an operating system that contains thousands of lines of code, but it started out as a simple program Linus Torvalds used to explore the Intel 80386 chip. According to Larry Greenfield, "One of Linus's earlier projects was a program that would switch between printing AAAA and BBBB. This later evolved to Linux." (_The Linux Users' Guide_ Beta Version 1) 

Later chapters will make more suggestions about debugging and other programming practices. 

### 1.4 Formal and natural languages

**Natural languages** are the languages that people speak, such as English, Spanish, and French. They were not designed by people (although people try to impose some order on them); they evolved naturally. 

**Formal languages** are languages that are designed by people for specific applications. For example, the notation that mathematicians use is a formal language that is particularly good at denoting relationships among numbers and symbols. Chemists use a formal language to represent the chemical structure of molecules. And most importantly: 

> **Programming languages are formal languages that have been designed to express computations.**

Formal languages tend to have strict rules about syntax. For example, `3+3=6` is a syntactically correct mathematical statement, but `3=+6$` is not. `H2O` is a syntactically correct chemical name, but `2Zz` is not. 

Syntax rules come in two flavors, pertaining to **tokens** and structure. Tokens are the basic elements of the language, such as words, numbers, and chemical elements. One of the problems with `3=+6$` is that `$` is not a legal token in mathematics (at least as far as we know). Similarly, `2Zz` is not legal because there is no element with the abbreviation `Zz`. 

The second type of syntax error pertains to the structure of a statement ~~~~ that is, the way the tokens are arranged. The statement `3=+6$` is structurally illegal because you can't place a plus sign immediately after an equal sign. Similarly, molecular formulas have to have subscripts after the element name, not before. 

> _As an exercise, create what appears to be a well-structured English sentence with unrecognizable tokens in it. Then write another sentence with all valid tokens but with invalid structure._

When you read a sentence in English or a statement in a formal language, you have to figure out what the structure of the sentence is (although in a natural language you do this subconsciously). This process is called **parsing**. 

For example, when you hear the sentence, "The other shoe fell," you understand that "the other shoe" is the subject and "fell" is the predicate. Once you have parsed a sentence, you can figure out what it means, or the semantics of the sentence. Assuming that you know what a shoe is and what it means to fall, you will understand the general implication of this sentence. 

Although formal and natural languages have many features in common ~~~~ tokens, structure, syntax, and semantics ~~~~ there are many differences: 

ambiguity
    Natural languages are full of ambiguity, which people deal with by using contextual clues and other information. Formal languages are designed to be nearly or completely unambiguous, which means that any statement has exactly one meaning, regardless of context.
redundancy
    In order to make up for ambiguity and reduce misunderstandings, natural languages employ lots of redundancy. As a result, they are often verbose. Formal languages are less redundant and more concise.
literalness
    Natural languages are full of idiom and metaphor. If I say, "The other shoe fell," there is probably no shoe and nothing falling. Formal languages mean exactly what they say.

People who grow up speaking a natural language ~~~~ everyone ~~~~ often have a hard time adjusting to formal languages. In some ways, the difference between formal and natural language is like the difference between poetry and prose, but more so: 

Poetry
    Words are used for their sounds as well as for their meaning, and the whole poem together creates an effect or emotional response. Ambiguity is not only common but often deliberate.
Prose
    The literal meaning of words is more important, and the structure contributes more meaning. Prose is more amenable to analysis than poetry but still often ambiguous.
Programs
    The meaning of a computer program is unambiguous and literal, and can be understood entirely by analysis of the tokens and structure.

Here are some suggestions for reading programs (and other formal languages). First, remember that formal languages are much more dense than natural languages, so it takes longer to read them. Also, the structure is very important, so it is usually not a good idea to read from top to bottom, left to right. Instead, learn to parse the program in your head, identifying the tokens and interpreting the structure. Finally, the details matter. Little things like spelling errors and bad punctuation, which you can get away with in natural languages, can make a big difference in a formal language. 

### 1.5 The first program

Traditionally, the first program written in a new language is called "Hello, World!" because all it does is display the words, "Hello, World!" In Python, it looks like this: 

`print "Hello, World!"   
`

This is an example of a **print statement** , which doesn't actually print anything on paper. It displays a value on the screen. In this case, the result is the words 

`Hello, World!   
`

The quotation marks in the program mark the beginning and end of the value; they don't appear in the result. 

Some people judge the quality of a programming language by the simplicity of the "Hello, World!" program. By this standard, Python does about as well as possible. 

### 1.6 Glossary

problem solving
    The process of formulating a problem, finding a solution, and expressing the solution.
high-level language
    A programming language like Python that is designed to be easy for humans to read and write.
low-level language
    A programming language that is designed to be easy for a computer to execute; also called "machine language" or "assembly language."
portability
    A property of a program that can run on more than one kind of computer.
interpret
    To execute a program in a high-level language by translating it one line at a time.
compile
    To translate a program written in a high-level language into a low-level language all at once, in preparation for later execution.
source code
    A program in a high-level language before being compiled.
object code
    The output of the compiler after it translates the program.
executable
    Another name for object code that is ready to be executed.
script
    A program stored in a file (usually one that will be interpreted).
program
    A set of instructions that specifies a computation.
algorithm
    A general process for solving a category of problems.
bug
    An error in a program.
debugging
    The process of finding and removing any of the three kinds of programming errors.
syntax
    The structure of a program.
syntax error
    An error in a program that makes it impossible to parse (and therefore impossible to interpret).
runtime error
    An error that does not occur until the program has started to execute but that prevents the program from continuing.
exception
    Another name for a runtime error.
semantic error
    An error in a program that makes it do something other than what the programmer intended.
semantics
    The meaning of a program.
natural language
    Any one of the languages that people speak that evolved naturally.
formal language
    Any one of the languages that people have designed for specific purposes, such as representing mathematical ideas or computer programs; all programming languages are formal languages.
token
    One of the basic elements of the syntactic structure of a program, analogous to a word in a natural language.
parse
    To examine a program and analyze the syntactic structure.
print statement
    An instruction that causes the Python interpreter to display a value on the screen.

This is an older version of the book now known as _Think Python_. You might prefer to [read a more recent version](<http://greenteapress.com/wp/think-python-2e/>). 

* * *

[![Previous](images/prev.png)](<contrib.html>) | [![Up](images/up.png)](<index.html>) | [![Next](images/next.png)](<chap02.html>) | How to Think Like a Computer Scientist | [![Index](images/index.png)](<dex.html>)  
---|---|---|---|---  
  
* * *

