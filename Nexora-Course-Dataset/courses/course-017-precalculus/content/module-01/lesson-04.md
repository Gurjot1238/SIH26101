# 1.4 Composition of Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/1-4-composition-of-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 1.4 Composition of Functions

### Learning Objectives

In this section, you will:

  * Combine functions using algebraic operations.
  * Create a new function by composition of functions.
  * Evaluate composite functions.
  * Find the domain of a composite function.
  * Decompose a composite function into its component functions.

Suppose we want to calculate how much it costs to heat a house on a particular day of the year. The cost to heat a house will depend on the average daily temperature, and in turn, the average daily temperature depends on the particular day of the year. Notice how we have just defined two relationships: The cost depends on the temperature, and the temperature depends on the day.

Using descriptive variables, we can notate these two functions. The function  C( T ) C( T ) gives the cost  C C of heating a house for a given average daily temperature in  T T degrees Celsius. The function  T( d ) T( d ) gives the average daily temperature on day  d d of the year. For any given day,  Cost=C( T( d ) ) Cost=C( T( d ) ) means that the cost depends on the temperature, which in turns depends on the day of the year. Thus, we can evaluate the cost function at the temperature  T( d ). T( d ). For example, we could evaluate  T( 5 ) T( 5 ) to determine the average daily temperature on the 5th day of the year. Then, we could evaluate the cost function at that temperature. We would write  C( T( 5 ) ). C( T( 5 ) ).

![Explanation of C\(T\(5\)\), which is the cost for the temperature and T\(5\) is the temperature on day 5.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/336d97bc881544921ca4876a504752b89148f9fd)

By combining these two relationships into one function, we have performed function composition, which is the focus of this section.

### Combining Functions Using Algebraic Operations

Function composition is only one way to combine existing functions. Another way is to carry out the usual algebraic operations on functions, such as addition, subtraction, multiplication and division. We do this by performing the operations with the function outputs, defining the result as the output of our new function.

Suppose we need to add two columns of numbers that represent a husband and wife’s separate annual incomes over a period of years, with the result being their total household income. We want to do this for every year, adding only that year’s incomes and then collecting all the data in a new column. If  w(y) w(y) is the wife’s income and  h(y) h(y) is the husband’s income in year  y, y, and we want  T T to represent the total income, then we can define a new function.

T( y )=h( y )+w( y ) T( y )=h( y )+w( y )

If this holds true for every year, then we can focus on the relation between the functions without reference to a year and write

T=h+w T=h+w

Just as for this sum of two functions, we can define difference, product, and ratio functions for any pair of functions that have the same kinds of inputs (not necessarily numbers) and also the same kinds of outputs (which do have to be numbers so that the usual operations of algebra can apply to them, and which also must have the same units or no units when we add and subtract). In this way, we can think of adding, subtracting, multiplying, and dividing functions.

For two functions  f( x ) f( x ) and  g( x ) g( x ) with real number outputs, we define new functions  f+g,f−g,fg, f+g,f−g,fg, and  f g f g by the relations

(f+g)(x)=f(x)+g(x) (f−g)(x)=f(x)−g(x) (fg)(x)=f(x)g(x) ( f g )(x)= f(x) g(x) (f+g)(x)=f(x)+g(x) (f−g)(x)=f(x)−g(x) (fg)(x)=f(x)g(x) ( f g )(x)= f(x) g(x)

###  Example  1

#### Performing Algebraic Operations on Functions

Find and simplify the functions  ( g−f )( x ) ( g−f )( x ) and  ( g f )( x ), ( g f )( x ), given  f( x )=x−1 f( x )=x−1 and  g( x )= x 2 −1. g( x )= x 2 −1. Are they the same function?

####  Solution

Begin by writing the general form, and then substitute the given functions.

(g−f)(x) = g(x)−f(x) (g−f)(x) = x 2 −1−(x−1) (g−f)(x) = x 2 −x (g−f)(x) = x(x−1) ( g f )(x) = g(x) f(x) ( g f )(x) = x 2 −1 x−1 ( g f )(x) = (x+1)(x−1) x−1 where x≠1 ( g f )(x) = x+1 (g−f)(x) = g(x)−f(x) (g−f)(x) = x 2 −1−(x−1) (g−f)(x) = x 2 −x (g−f)(x) = x(x−1) ( g f )(x) = g(x) f(x) ( g f )(x) = x 2 −1 x−1 ( g f )(x) = (x+1)(x−1) x−1 where x≠1 ( g f )(x) = x+1

No, the functions are not the same.

Note: For  ( g f )( x ), ( g f )( x ), the condition  x≠1 x≠1 is necessary because when  x=1, x=1, the denominator is equal to 0, which makes the function undefined.

###  Try It  #1

Find and simplify the functions  ( fg )( x ) ( fg )( x ) and  ( f−g )( x ). ( f−g )( x ).

f( x )=x−1 and g( x )= x 2 −1 f( x )=x−1 and g( x )= x 2 −1

Are they the same function?

### Create a Function by Composition of Functions

Performing algebraic operations on functions combines them into a new function, but we can also create functions by composing functions. When we wanted to compute a heating cost from a day of the year, we created a new function that takes a day as input and yields a cost as output. The process of combining functions so that the output of one function becomes the input of another is known as a composition of functions**.** The resulting function is known as a **composite function**. We represent this combination by the following notation:

( f∘g )( x )=f( g( x ) ) ( f∘g )( x )=f( g( x ) )

We read the left-hand side as  “f “f composed with  g g at  x,” x,” and the right-hand side as  “f “f of  g g of  x.” x.” The two sides of the equation have the same mathematical meaning and are equal. The open circle symbol  ∘ ∘ is called the composition operator. We use this operator mainly when we wish to emphasize the relationship between the functions themselves without referring to any particular input value. Composition is a binary operation that takes two functions and forms a new function, much as addition or multiplication takes two numbers and gives a new number. However, it is important not to confuse function composition with multiplication because, as we learned above, in most cases  f(g(x))≠f(x)g(x). f(g(x))≠f(x)g(x).

It is also important to understand the order of operations in evaluating a composite function. We follow the usual convention with parentheses by starting with the innermost parentheses first, and then working to the outside. In the equation above, the function  g g takes the input  x x first and yields an output  g( x ). g( x ). Then the function  f f takes  g( x ) g( x ) as an input and yields an output  f( g( x ) ). f( g( x ) ).

![Explanation of the composite function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/c02500912de8e653c7e833a6aa2d53696a4c7630)

In general,  f∘g f∘g and  g∘f g∘f are different functions. In other words, in many cases  f( g( x ) )≠g( f( x ) ) f( g( x ) )≠g( f( x ) ) for all  x. x. We will also see that sometimes two functions can be composed only in one specific order.

For example, if  f( x )= x 2 f( x )= x 2 and  g( x )=x+2, g( x )=x+2, then

f(g(x))=f(x+2) = (x+2) 2 = x 2 +4x+4 f(g(x))=f(x+2) = (x+2) 2 = x 2 +4x+4

but

g(f(x))=g( x 2 ) = x 2 +2 g(f(x))=g( x 2 ) = x 2 +2

These expressions are not equal for all values of  x, x, so the two functions are not equal. It is irrelevant that the expressions happen to be equal for the single input value  x=− 1 2 . x=− 1 2 .

Note that the range of the inside function (the first function to be evaluated) needs to be within the domain of the outside function. Less formally, the composition has to make sense in terms of inputs and outputs.

###  Composition of Functions

When the output of one function is used as the input of another, we call the entire operation a composition of functions. For any input  x x and functions  f f and  g, g, this action defines a composite function, which we write as  f∘g f∘g such that

( f∘g )( x )=f( g( x ) ) ( f∘g )( x )=f( g( x ) )

The domain of the composite function  f∘g f∘g is all  x x such that  x x is in the domain of  g g and  g( x ) g( x ) is in the domain of  f. f.

It is important to realize that the product of functions  fg fg is not the same as the function composition  f( g( x ) ), f( g( x ) ), because, in general,  f( x )g( x )≠f( g( x ) ). f( x )g( x )≠f( g( x ) ).

###  Example  2

#### Determining whether Composition of Functions is Commutative

Using the functions provided, find  f( g( x ) ) f( g( x ) ) and  g( f( x ) ). g( f( x ) ). Determine whether the composition of the functions is commutative.

f(x)=2x+1g(x)=3−x f(x)=2x+1g(x)=3−x

####  Solution

Let’s begin by substituting  g( x ) g( x ) into  f( x ). f( x ).

f(g(x))=2(3−x)+1 =6−2x+1 =7−2x f(g(x))=2(3−x)+1 =6−2x+1 =7−2x

Now we can substitute  f( x ) f( x ) into  g( x ). g( x ).

g(f(x))=3−(2x+1) =3−2x−1 =−2x+2 g(f(x))=3−(2x+1) =3−2x−1 =−2x+2

We find that  g(f(x))≠f(g(x)), g(f(x))≠f(g(x)), so the operation of function composition is not commutative.

###  Example  3

#### Interpreting Composite Functions

The function  c(s) c(s) gives the number of calories burned completing  s s sit-ups, and  s(t) s(t) gives the number of sit-ups a person can complete in  t t minutes. Interpret  c(s(3)). c(s(3)).

####  Solution

The inside expression in the composition is  s(3). s(3). Because the input to the _s_ -function is time,  t=3 t=3 represents 3 minutes, and  s(3) s(3) is the number of sit-ups completed in 3 minutes. 

Using  s(3) s(3) as the input to the function  c(s) c(s) gives us the number of calories burned during the number of sit-ups that can be completed in 3 minutes, or simply the number of calories burned in 3 minutes (by doing sit-ups).

###  Example  4

#### Investigating the Order of Function Composition

Suppose  f(x) f(x) gives miles that can be driven in  x x hours and  g(y) g(y) gives the gallons of gas used in driving  y y miles. Which of these expressions is meaningful:  f( g(y) ) f( g(y) ) or  g( f(x) )? g( f(x) )?

####  Solution

The function  y=f( x ) y=f( x ) is a function whose output is the number of miles driven corresponding to the number of hours driven. 

number of miles =f(number of hours) number of miles =f(number of hours)

The function  g( y ) g( y ) is a function whose output is the number of gallons used corresponding to the number of miles driven. This means:

number of gallons =g(number of miles) number of gallons =g(number of miles)

The expression  g(y) g(y) takes miles as the input and a number of gallons as the output. The function  f(x) f(x) requires a number of hours as the input. Trying to input a number of gallons does not make sense. The expression  f( g(y) ) f( g(y) ) is meaningless.

The expression  f(x) f(x) takes hours as input and a number of miles driven as the output. The function  g(y) g(y) requires a number of miles as the input. Using  f(x) f(x) (miles driven) as an input value for  g(y), g(y), where gallons of gas depends on miles driven, does make sense. The expression  g( f(x) ) g( f(x) ) makes sense, and will yield the number of gallons of gas used,  g, g, driving a certain number of miles,  f(x), f(x), in  x x hours.

###  Q&A

Are there any situations where  f(g(y)) f(g(y)) and  g(f(x)) g(f(x)) would both be meaningful or useful expressions?

_Yes. For many pure mathematical functions, both compositions make sense, even though they usually produce different new functions. In real-world problems, functions whose inputs and outputs have the same units also may give compositions that are meaningful in either order._

###  Try It  #2

The gravitational force on a planet a distance _r_ from the sun is given by the function  G(r). G(r). The acceleration of a planet subjected to any force  F F is given by the function  a(F). a(F). Form a meaningful composition of these two functions, and explain what it means.

### Evaluating Composite Functions

Once we compose a new function from two existing functions, we need to be able to evaluate it for any input in its domain. We will do this with specific numerical inputs for functions expressed as tables, graphs, and formulas and with variables as inputs to functions expressed as formulas. In each case, we evaluate the inner function using the starting input and then use the inner function’s output as the input for the outer function.

#### Evaluating Composite Functions Using Tables

When working with functions given as tables, we read input and output values from the table entries and always work from the inside to the outside. We evaluate the inside function first and then use the output of the inside function as the input to the outside function.

###  Example  5

#### Using a Table to Evaluate a Composite Function

Using [Table 1](<1-4-composition-of-functions#Table_01_04_01>), evaluate  f(g(3)) f(g(3)) and  g(f(3)). g(f(3)).

x x |  f(x) f(x) |  g(x) g(x)  
---|---|---  
1 | 6 | 3  
2 | 8 | 5  
3 | 3 | 2  
4 | 1 | 7  
  
Table  1

####  Solution

To evaluate  f(g(3)), f(g(3)), we start from the inside with the input value 3. We then evaluate the inside expression  g(3) g(3) using the table that defines the function  g: g: g(3)=2. g(3)=2. We can then use that result as the input to the function  f, f, so  g(3) g(3) is replaced by 2 and we get  f(2). f(2). Then, using the table that defines the function  f, f, we find that  f(2)=8. f(2)=8.

g(3)=2 f(g(3))=f(2)=8 g(3)=2 f(g(3))=f(2)=8

To evaluate  g(f(3)), g(f(3)), we first evaluate the inside expression  f(3) f(3) using the first table:  f(3)=3. f(3)=3. Then, using the table for  g,  g,  we can evaluate

g(f(3))=g(3)=2 g(f(3))=g(3)=2

[Table 2](<1-4-composition-of-functions#Table_01_04_02>) shows the composite functions  f∘g f∘g and  g∘f g∘f as tables.

x x |  g( x ) g( x ) |  f( g( x ) ) f( g( x ) ) |  f( x ) f( x ) |  g( f( x ) ) g( f( x ) )  
---|---|---|---|---  
3 | 2 | 8 | 3 | 2  
  
Table  2

###  Try It  #3

Using [Table 1](<1-4-composition-of-functions#Table_01_04_01>), evaluate  f(g(1)) f(g(1)) and  g(f(4)). g(f(4)).

#### Evaluating Composite Functions Using Graphs

When we are given individual functions as graphs, the procedure for evaluating composite functions is similar to the process we use for evaluating tables. We read the input and output values, but this time, from the  x- x- and  y- y- axes of the graphs.

###  How To

**Given a composite function and graphs of its individual functions, evaluate it using the information provided by the graphs.**

  1. Locate the given input to the inner function on the  x- x- axis of its graph.
  2. Read off the output of the inner function from the  y- y- axis of its graph.
  3. Locate the inner function output on the  x- x- axis of the graph of the outer function.
  4. Read the output of the outer function from the  y- y- axis of its graph. This is the output of the composite function.

###  Example  6

#### Using a Graph to Evaluate a Composite Function

Using [Figure 1](<1-4-composition-of-functions#Figure_01_04_002>), evaluate  f(g(1)). f(g(1)).

![Explanation of the composite function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/710401844b9cc0b203a1628994a0471665da4606) Figure  1

####  Solution

To evaluate  f(g(1)), f(g(1)), we start with the inside evaluation. See [Figure 2](<1-4-composition-of-functions#Figure_01_04_004>).

![Two graphs of a positive parabola \(g\(x\)\) and a negative parabola \(f\(x\)\). The following points are plotted: g\(1\)=3 and f\(3\)=6.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1a4f77e97532d00365df5e04baa926573bf7dc1d) Figure  2

We evaluate  g(1) g(1) using the graph of  g(x), g(x), finding the input of 1 on the  x- x- axis and finding the output value of the graph at that input. Here,  g(1)=3. g(1)=3. We use this value as the input to the function  f. f.

f(g(1))=f(3) f(g(1))=f(3)

We can then evaluate the composite function by looking to the graph of  f(x), f(x), finding the input of 3 on the  x- x- axis and reading the output value of the graph at this input. Here,  f(3)=6, f(3)=6, so  f(g(1))=6. f(g(1))=6.

#### Analysis 

[Figure 3](<1-4-composition-of-functions#Figure_01_04_005>) shows how we can mark the graphs with arrows to trace the path from the input value to the output value.

![Two graphs of a positive and negative parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1e361fa96a49dfe00c62ba71530d9e241e620872) Figure  3

###  Try It  #4

Using [Figure 1](<1-4-composition-of-functions#Figure_01_04_002>), evaluate  g(f(2)). g(f(2)).

#### Evaluating Composite Functions Using Formulas

When evaluating a composite function where we have either created or been given formulas, the rule of working from the inside out remains the same. The input value to the outer function will be the output of the inner function, which may be a numerical value, a variable name, or a more complicated expression.

While we can compose the functions for each individual input value, it is sometimes helpful to find a single formula that will calculate the result of a composition  f( g( x ) ). f( g( x ) ). To do this, we will extend our idea of function evaluation. Recall that, when we evaluate a function like  f(t)= t 2 −t, f(t)= t 2 −t, we substitute the value inside the parentheses into the formula wherever we see the input variable.

###  How To

**Given a formula for a composite function, evaluate the function.**

  1. Evaluate the inside function using the input value or variable provided.
  2. Use the resulting output as the input to the outside function.

###  Example  7

#### Evaluating a Composition of Functions Expressed as Formulas with a Numerical Input

Given  f(t)= t 2 −t f(t)= t 2 −t and  h(x)=3x+2, h(x)=3x+2, evaluate  f(h(1)). f(h(1)).

####  Solution

Because the inside expression is  h(1), h(1), we start by evaluating  h(x) h(x) at 1.

h(1)=3(1)+2 h(1)=5 h(1)=3(1)+2 h(1)=5

Then  f(h(1))=f(5), f(h(1))=f(5), so we evaluate  f(t) f(t) at an input of 5.

f(h(1))=f(5) f(h(1))= 5 2 −5 f(h(1))=20 f(h(1))=f(5) f(h(1))= 5 2 −5 f(h(1))=20

#### Analysis 

It makes no difference what the input variables  t t and  x x were called in this problem because we evaluated for specific numerical values.

###  Try It  #5

Given  f(t)= t 2 −t f(t)= t 2 −t and  h(x)=3x+2, h(x)=3x+2, evaluate 

  1. ⓐ h(f(2)) h(f(2))
  2. ⓑ h(f(−2)) h(f(−2))

### Finding the Domain of a Composite Function

As we discussed previously, the domain of a composite function such as  f∘g f∘g is dependent on the domain of  g g and the domain of  f. f. It is important to know when we can apply a composite function and when we cannot, that is, to know the domain of a function such as  f∘g. f∘g. Let us assume we know the domains of the functions  f f and  g g separately. If we write the composite function for an input  x x as  f( g( x ) ), f( g( x ) ), we can see right away that  x x must be a member of the domain of  g g in order for the expression to be meaningful, because otherwise we cannot complete the inner function evaluation. However, we also see that  g( x ) g( x ) must be a member of the domain of  f, f, otherwise the second function evaluation in  f( g( x ) ) f( g( x ) ) cannot be completed, and the expression is still undefined. Thus the domain of  f∘g f∘g consists of only those inputs in the domain of  g g that produce outputs from  g g belonging to the domain of  f. f. Note that the domain of  f f composed with  g g is the set of all  x x such that  x x is in the domain of  g g and  g( x ) g( x ) is in the domain of  f. f.

###  Domain of a Composite Function

The domain of a composite function  f( g( x ) ) f( g( x ) ) is the set of those inputs  x x in the domain of  g g for which  g( x ) g( x ) is in the domain of  f. f.

###  How To

**Given a function composition f(g(x)), f(g(x)), determine its domain.**

  1. Find the domain of  g. g.
  2. Find the domain of  f. f.
  3. Find those inputs  x x in the domain of  g g for which  g( x ) g( x ) is in the domain of  f. f. That is, exclude those inputs  x x from the domain of  g g for which  g( x ) g( x ) is not in the domain of  f. f. The resulting set is the domain of  f∘g. f∘g.

###  Example  8

#### Finding the Domain of a Composite Function

Find the domain of

( f∘g )(x) wheref(x)= 5 x−1 andg(x)= 4 3x−2 ( f∘g )(x) wheref(x)= 5 x−1 andg(x)= 4 3x−2

####  Solution

The domain of  g( x ) g( x ) consists of all real numbers except  x= 2 3 , x= 2 3 , since that input value would cause us to divide by 0. Likewise, the domain of  f f consists of all real numbers except 1. So we need to exclude from the domain of  g( x ) g( x ) that value of  x x for which  g( x )=1. g( x )=1.

4 3x−2 =1 4=3x−2 6=3x x=2 4 3x−2 =1 4=3x−2 6=3x x=2

So the domain of  f∘g f∘g is the set of all real numbers except  2 3 2 3 and  2. 2. This means that

x≠ 2 3 orx≠2 x≠ 2 3 orx≠2

We can write this in interval notation as

( −∞, 2 3 )∪( 2 3 ,2 )∪( 2,∞ ) ( −∞, 2 3 )∪( 2 3 ,2 )∪( 2,∞ )

###  Example  9

#### Finding the Domain of a Composite Function Involving Radicals

Find the domain of

( f∘g )(x) wheref(x)= x+2 andg(x)= 3−x ( f∘g )(x) wheref(x)= x+2 andg(x)= 3−x

####  Solution

Because we cannot take the square root of a negative number, the domain of  g g is  ( −∞,3 ]. ( −∞,3 ]. Now we check the domain of the composite function

( f∘g )(x)= 3−x+2 ( f∘g )(x)= 3−x+2

For  ( f∘g )(x)= 3−x+2 , 3−x+2 ≥0, ( f∘g )(x)= 3−x+2 ,3−x+2≥0, since the radicand of a square root must be positive. Since square roots are positive,  3−x ≥0 , 3−x ≥0 , or,  3−x ≥0, 3−x ≥0, which gives a domain of  (-∞,3] (-∞,3] .

#### Analysis 

This example shows that knowledge of the range of functions (specifically the inner function) can also be helpful in finding the domain of a composite function. It also shows that the domain of  f∘g f∘g can contain values that are not in the domain of  f, f, though they must be in the domain of  g. g.

###  Try It  #6

Find the domain of

( f∘g )(x) wheref(x)= 1 x−2 andg(x)= x+4 ( f∘g )(x) wheref(x)= 1 x−2 andg(x)= x+4

### Decomposing a Composite Function into its Component Functions

In some cases, it is necessary to decompose a complicated function. In other words, we can write it as a composition of two simpler functions. There may be more than one way to decompose a composite function, so we may choose the decomposition that appears to be most expedient.

###  Example  10

#### Decomposing a Function

Write  f(x)= 5− x 2 f(x)= 5− x 2 as the composition of two functions.

####  Solution

We are looking for two functions,  g g and  h, h, so  f(x)=g(h(x)). f(x)=g(h(x)). To do this, we look for a function inside a function in the formula for  f(x). f(x). As one possibility, we might notice that the expression  5− x 2 5− x 2 is the inside of the square root. We could then decompose the function as

h(x)=5− x 2 and g(x)= x h(x)=5− x 2 and g(x)= x

We can check our answer by recomposing the functions.

g(h(x))=g( 5− x 2 )= 5− x 2 g(h(x))=g( 5− x 2 )= 5− x 2

###  Try It  #7

Write  f(x)= 4 3− 4+ x 2 f(x)= 4 3− 4+ x 2 as the composition of two functions.

###  Media

Access these online resources for additional instruction and practice with composite functions.

  * [Composite Functions](<http://openstax.org/l/compfunction>)
  * [Composite Function Notation Application](<http://openstax.org/l/compfuncnot>)
  * [Composite Functions Using Graphs](<http://openstax.org/l/compfuncgraph>)
  * [Decompose Functions](<http://openstax.org/l/decompfunction>)
  * [Composite Function Values](<http://openstax.org/l/compfuncvalue>)

###  1.4 Section Exercises

#### Verbal

[1](<chapter-1>). 

How does one find the domain of the quotient of two functions,  f g ? f g ?

2. 

What is the composition of two functions,  f∘g? f∘g?

[3](<chapter-1>). 

If the order is reversed when composing two functions, can the result ever be the same as the answer in the original order of the composition? If yes, give an example. If no, explain why not.

4. 

How do you find the domain for the composition of two functions,  f∘g? f∘g?

#### Algebraic

[5](<chapter-1>). 

Given  f(x)= x 2 +2x f(x)= x 2 +2x and  g(x)=6− x 2 , g(x)=6− x 2 , find  f+g,f−g,fg, f+g,f−g,fg, and  f g . f g . Determine the domain for each function in interval notation.

6. 

Given  f(x)=−3 x 2 +x f(x)=−3 x 2 +x and  g(x)=5, g(x)=5, find  f+g,f−g,fg, f+g,f−g,fg, and  f g . f g . Determine the domain for each function in interval notation.

[7](<chapter-1>). 

Given  f(x)=2 x 2 +4x f(x)=2 x 2 +4x and  g(x)= 1 2x , g(x)= 1 2x , find  f+g,f−g,fg, f+g,f−g,fg, and  f g . f g . Determine the domain for each function in interval notation.

8. 

Given  f(x)= 1 x−4 f(x)= 1 x−4 and  g(x)= 1 6−x , g(x)= 1 6−x , find  f+g,f−g,fg, f+g,f−g,fg, and  f g . f g . Determine the domain for each function in interval notation.

[9](<chapter-1>). 

Given  f(x)=3 x 2 f(x)=3 x 2 and  g(x)= x−5 , g(x)= x−5 , find  f+g,f−g,fg, f+g,f−g,fg, and  f g . f g . Determine the domain for each function in interval notation.

10. 

Given  f(x)= x f(x)= x and  g(x)=|x−3|, g(x)=|x−3|, find  g f . g f . Determine the domain of the function in interval notation.

[11](<chapter-1>). 

Given  f(x)=2 x 2 +1 f(x)=2 x 2 +1 and  g(x)=3x−5, g(x)=3x−5, find the following:

  1. ⓐ f(g(2)) f(g(2))
  2. ⓑ f(g(x)) f(g(x))
  3. ⓒ g(f(x)) g(f(x))
  4. ⓓ ( g∘g )( x ) ( g∘g )( x )
  5. ⓔ ( f∘f )( −2 ) ( f∘f )( −2 )

For the following exercises, use each pair of functions to find  f( g( x ) ) f( g( x ) ) and  g( f( x ) ). g( f( x ) ). Simplify your answers.

12. 

f(x)= x 2 +1,g(x)= x+2 f(x)= x 2 +1,g(x)= x+2

[13](<chapter-1>). 

f(x)= x +2,g(x)= x 2 +3 f(x)= x +2,g(x)= x 2 +3

14. 

f(x)=| x |,g(x)=5x+1 f(x)=| x |,g(x)=5x+1

[15](<chapter-1>). 

f(x)= x 3 ,g(x)= x+1 x 3 f(x)= x 3 ,g(x)= x+1 x 3

16. 

f(x)= 1 x−6 ,g(x)= 7 x +6 f(x)= 1 x−6 ,g(x)= 7 x +6

[17](<chapter-1>). 

f(x)= 1 x−4 ,g(x)= 2 x +4 f(x)= 1 x−4 ,g(x)= 2 x +4

For the following exercises, use each set of functions to find  f( g( h(x) ) ). f( g( h(x) ) ). Simplify your answers.

18. 

f(x)= x 4 +6, f(x)= x 4 +6, g(x)=x−6, g(x)=x−6, and  h(x)= x h(x)= x

[19](<chapter-1>). 

f(x)= x 2 +1, f(x)= x 2 +1, g(x)= 1 x , g(x)= 1 x , and  h(x)=x+3 h(x)=x+3

20. 

Given  f(x)= 1 x f(x)= 1 x and  g(x)=x−3, g(x)=x−3, find the following:

  1. ⓐ (f∘g)(x) (f∘g)(x)
  2. ⓑ the domain of  (f∘g)(x) (f∘g)(x) in interval notation
  3. ⓒ (g∘f)(x) (g∘f)(x)
  4. ⓓ the domain of  (g∘f)(x) (g∘f)(x)
  5. ⓔ ( f g )x ( f g )x

[21](<chapter-1>). 

Given  f(x)= 2−4x f(x)= 2−4x and  g(x)=− 3 x , g(x)=− 3 x , find the following:

  1. ⓐ (g∘f)(x) (g∘f)(x)
  2. ⓑ the domain of  (g∘f)(x) (g∘f)(x) in interval notation

22. 

Given the functions  f(x)= 1−x x andg(x)= 1 1+ x 2 , f(x)= 1−x x andg(x)= 1 1+ x 2 , find the following:

  1. ⓐ (g∘f)(x) (g∘f)(x)
  2. ⓑ (g∘f)(2) (g∘f)(2)

[23](<chapter-1>). 

Given functions  p(x)= 1 x p(x)= 1 x and  m(x)= x 2 −4, m(x)= x 2 −4, state the domain of each of the following functions using interval notation:

  1. ⓐ p(x) m(x) p(x) m(x)
  2. ⓑ p(m(x)) p(m(x))
  3. ⓒ m(p(x)) m(p(x))

24. 

Given functions  q(x)= 1 x q(x)= 1 x and  h(x)= x 2 −9, h(x)= x 2 −9, state the domain of each of the following functions using interval notation.

  1. ⓐ q(x) h(x) q(x) h(x)
  2. ⓑ q( h(x) ) q( h(x) )
  3. ⓒ h( q(x) ) h( q(x) )

[25](<chapter-1>). 

For  f(x)= 1 x f(x)= 1 x and  g(x)= x−1 , g(x)= x−1 , write the domain of  (f∘g)(x) (f∘g)(x) in interval notation.

For the following exercises, find functions  f(x) f(x) and  g(x) g(x) so the given function can be expressed as  h(x)=f( g(x) ). h(x)=f( g(x) ).

26. 

h(x)= (x+2) 2 h(x)= (x+2) 2

[27](<chapter-1>). 

h(x)= (x−5) 3 h(x)= (x−5) 3

28. 

h(x)= 3 x−5 h(x)= 3 x−5

[29](<chapter-1>). 

h(x)= 4 (x+2) 2 h(x)= 4 (x+2) 2

30. 

h(x)=4+ x 3 h(x)=4+ x 3

[31](<chapter-1>). 

h(x)= 1 2x−3 3 h(x)= 1 2x−3 3

32. 

h(x)= 1 (3 x 2 −4) −3 h(x)= 1 (3 x 2 −4) −3

[33](<chapter-1>). 

h(x)= 3x−2 x+5 4 h(x)= 3x−2 x+5 4

34. 

h(x)= ( 8+ x 3 8− x 3 ) 4 h(x)= ( 8+ x 3 8− x 3 ) 4

[35](<chapter-1>). 

h(x)= 2x+6 h(x)= 2x+6

36. 

h(x)= (5x−1) 3 h(x)= (5x−1) 3

[37](<chapter-1>). 

h(x)= x−1 3 h(x)= x−1 3

38. 

h(x)=| x 2 +7 | h(x)=| x 2 +7 |

[39](<chapter-1>). 

h(x)= 1 (x−2) 3 h(x)= 1 (x−2) 3

40. 

h(x)= ( 1 2x−3 ) 2 h(x)= ( 1 2x−3 ) 2

[41](<chapter-1>). 

h(x)= 2x−1 3x+4 h(x)= 2x−1 3x+4

#### Graphical

For the following exercises, use the graphs of  f, f, shown in [Figure 4](<1-4-composition-of-functions#Figure_01_04_201>), and  g, g, shown in [Figure 5](<1-4-composition-of-functions#Figure_01_04_202>), to evaluate the expressions.

![Graph of a function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5e14e3bc01b2ff22fa110f29cb8ad9bfedc3c4e6) Figure  4

![Graph of a function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/752b0a363b5623bf178e5362bf81c2fa351cebec) Figure  5

42. 

f( g(3) ) f( g(3) )

[43](<chapter-1>). 

f( g(1) ) f( g(1) )

44. 

g( f(1) ) g( f(1) )

[45](<chapter-1>). 

g( f(0) ) g( f(0) )

46. 

f( f(5) ) f( f(5) )

[47](<chapter-1>). 

f( f(4) ) f( f(4) )

48. 

g( g(2) ) g( g(2) )

[49](<chapter-1>). 

g( g(0) ) g( g(0) )

For the following exercises, use graphs of  f(x), f(x), shown in [Figure 6](<1-4-composition-of-functions#Figure_01_04_203>),  g(x), g(x), shown in [Figure 7](<1-4-composition-of-functions#Figure_01_04_204>), and  h(x), h(x), shown in [Figure 8](<1-4-composition-of-functions#Figure_01_04_205>), to evaluate the expressions.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/34c78aa420faa02407336fe01fa82a31bff579f6) Figure  6

![Graph of a parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e2b91f80e038681a7587b59b0c3e1fb6bd1f1e1c) Figure  7

![Graph of a square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/cfe99cac0276c32fe33e2af3f5eead3dac4e00c7) Figure  8

50. 

g( f( 1 ) ) g( f( 1 ) )

[51](<chapter-1>). 

g( f( 2 ) ) g( f( 2 ) )

52. 

f( g( 4 ) ) f( g( 4 ) )

[53](<chapter-1>). 

f( g( 1 ) ) f( g( 1 ) )

54. 

f( h( 2 ) ) f( h( 2 ) )

[55](<chapter-1>). 

h( f( 2 ) ) h( f( 2 ) )

56. 

f( g( h( 4 ) ) ) f( g( h( 4 ) ) )

[57](<chapter-1>). 

f( g( f( −2 ) ) ) f( g( f( −2 ) ) )

#### Numeric

For the following exercises, use the function values for  f and g f and g shown in [Table 3](<1-4-composition-of-functions#Table_01_04_03>) to evaluate each expression.

** x x ** | ** f(x) f(x) ** | ** g(x) g(x) **  
---|---|---  
0| 7| 9  
1| 6| 5  
2| 5| 6  
3| 8| 2  
4| 4| 1  
5| 0| 8  
6| 2| 7  
7| 1| 3  
8| 9| 4  
9| 3| 0  
  
Table  3

58. 

f( g( 8 ) ) f( g( 8 ) )

[59](<chapter-1>). 

f( g( 5 ) ) f( g( 5 ) )

60. 

g( f( 5 ) ) g( f( 5 ) )

[61](<chapter-1>). 

g( f( 3 ) ) g( f( 3 ) )

62. 

f( f( 4 ) ) f( f( 4 ) )

[63](<chapter-1>). 

f( f( 1 ) ) f( f( 1 ) )

64. 

g( g( 2 ) ) g( g( 2 ) )

[65](<chapter-1>). 

g( g( 6 ) ) g( g( 6 ) )

For the following exercises, use the function values for  f and g f and g shown in [Table 4](<1-4-composition-of-functions#Table_01_04_04>) to evaluate the expressions.

** xx ** | ** f(x) f(x) ** | ** g(x) g(x) **  
---|---|---  
-3| 11| -8  
-2| 9| -3  
-1| 7| 0  
0| 5| 1  
1| 3| 0  
2| 1| -3  
3| -1| -8  
  
Table  4

66. 

(f∘g)(1) (f∘g)(1)

[67](<chapter-1>). 

(f∘g)(2) (f∘g)(2)

68. 

(g∘f)(2) (g∘f)(2)

[69](<chapter-1>). 

(g∘f)(3) (g∘f)(3)

70. 

(g∘g)(1) (g∘g)(1)

[71](<chapter-1>). 

(f∘f)(3) (f∘f)(3)

For the following exercises, use each pair of functions to find  f( g( 0 ) ) f( g( 0 ) ) and  g( f(0) ). g( f(0) ).

72. 

f(x)=4x+8,g(x)=7− x 2 f(x)=4x+8,g(x)=7− x 2

[73](<chapter-1>). 

f(x)=5x+7,g(x)=4−2 x 2 f(x)=5x+7,g(x)=4−2 x 2

74. 

f(x)= x+4 ,g(x)=12− x 3 f(x)= x+4 ,g(x)=12− x 3

[75](<chapter-1>). 

f(x)= 1 x+2 ,g(x)=4x+3 f(x)= 1 x+2 ,g(x)=4x+3

For the following exercises, use the functions  f(x)=2 x 2 +1 f(x)=2 x 2 +1 and  g(x)=3x+5 g(x)=3x+5 to evaluate or find the composite function as indicated.

76. 

f( g(2) ) f( g(2) )

[77](<chapter-1>). 

f( g(x) ) f( g(x) )

78. 

g( f(−3) ) g( f(−3) )

[79](<chapter-1>). 

(g∘g)(x) (g∘g)(x)

#### Extensions

For the following exercises, use  f(x)= x 3 +1 f(x)= x 3 +1 and  g(x)= x−1 3 . g(x)= x−1 3 .

80. 

Find  (f∘g)(x) (f∘g)(x) and  (g∘f)(x). (g∘f)(x). Compare the two answers.

[81](<chapter-1>). 

Find  (f∘g)(2) (f∘g)(2) and  (g∘f)(2). (g∘f)(2).

82. 

What is the domain of  (g∘f)(x)? (g∘f)(x)?

[83](<chapter-1>). 

What is the domain of  (f∘g)(x)? (f∘g)(x)?

84. 

Let  f(x)= 1 x . f(x)= 1 x .

  1. ⓐ Find  (f∘f)(x). (f∘f)(x).
  2. ⓑ Is  (f∘f)(x) (f∘f)(x) for any function  f f the same result as the answer to part (a) for any function? Explain.

For the following exercises, let  F(x)= (x+1) 5 , F(x)= (x+1) 5 , f(x)= x 5 , f(x)= x 5 , and  g(x)=x+1. g(x)=x+1.

[85](<chapter-1>). 

True or False:  (g∘f)(x)=F(x). (g∘f)(x)=F(x).

86. 

True or False:  (f∘g)(x)=F(x). (f∘g)(x)=F(x).

For the following exercises, find the composition when  f(x)= x 2 +2 f(x)= x 2 +2 for all  x≥0 x≥0 and  g(x)= x−2 . g(x)= x−2 .

[87](<chapter-1>). 

(f∘g)(6);(g∘f)(6) (f∘g)(6);(g∘f)(6)

88. 

(g∘f)(a);(f∘g)(a) (g∘f)(a);(f∘g)(a)

[89](<chapter-1>). 

(f∘g)(11);(g∘f)(11) (f∘g)(11);(g∘f)(11)

#### Real-World Applications

90. 

The function  D(p) D(p) gives the number of items that will be demanded when the price is  p. p. The production cost  C(x) C(x) is the cost of producing  x x items. To determine the cost of production when the price is $6, you would do which of the following?

  1. ⓐ Evaluate  D( C(6) ). D( C(6) ).
  2. ⓑ Evaluate  C( D(6) ). C( D(6) ).
  3. ⓒ Solve  D( C(x) )=6. D( C(x) )=6.
  4. ⓓ Solve  C( D(p) )=6. C( D(p) )=6.

[91](<chapter-1>). 

The function  A(d) A(d) gives the pain level on a scale of 0 to 10 experienced by a patient with  d d milligrams of a pain-reducing drug in her system. The milligrams of the drug in the patient’s system after  t t minutes is modeled by  m(t). m(t). Which of the following would you do in order to determine when the patient will be at a pain level of 4?

  1. ⓐ Evaluate  A( m(4) ). A( m(4) ).
  2. ⓑ Evaluate  m( A(4) ). m( A(4) ).
  3. ⓒ Solve  A( m(t) )=4. A( m(t) )=4.
  4. ⓓ Solve  m( A(d) )=4. m( A(d) )=4.

92. 

A store offers customers a 30% discount on the price  x x of selected items. Then, the store takes off an additional 15% at the cash register. Write a price function  P(x) P(x) that computes the final price of the item in terms of the original price  x. x. (Hint: Use function composition to find your answer.)

[93](<chapter-1>). 

A rain drop hitting a lake makes a circular ripple. If the radius, in inches, grows as a function of time in minutes according to  r(t)=25 t+2 , r(t)=25 t+2 , find the area of the ripple as a function of time. Find the area of the ripple at  t=2. t=2.

94. 

A forest fire leaves behind an area of grass burned in an expanding circular pattern. If the radius of the circle of burning grass is increasing with time according to the formula  r(t)=2t+1, r(t)=2t+1, express the area burned as a function of time,  t t (minutes).

[95](<chapter-1>). 

Use the function you found in the previous exercise to find the total area burned after 5 minutes.

96. 

The radius  r, r, in inches, of a spherical balloon is related to the volume,  V, V, by  r(V)= 3V 4π 3 . r(V)= 3V 4π 3 . Air is pumped into the balloon, so the volume after  t t seconds is given by  V(t)=10+20t. V(t)=10+20t.

  1. ⓐ Find the composite function  r( V(t) ). r( V(t) ).
  2. ⓑ Find the _exact_ time when the radius reaches 10 inches.

[97](<chapter-1>). 

The number of bacteria in a refrigerated food product is given by  N(T)=23 T 2 −56T+1, N(T)=23 T 2 −56T+1, 3<T<33, 3<T<33, where  T T is the temperature of the food. When the food is removed from the refrigerator, the temperature is given by  T(t)=5t+1.5, T(t)=5t+1.5, where  t t is the time in hours.

  1. ⓐ Find the composite function  N( T(t) ). N( T(t) ).
  2. ⓑ Find the time (round to two decimal places) when the bacteria count reaches 6752.

