# 3.6 Zeros of Polynomial Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/3-6-zeros-of-polynomial-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.6 Zeros of Polynomial Functions

### Learning Objectives

In this section, you will:

  * Evaluate a polynomial using the Remainder Theorem.
  * Use the Factor Theorem to solve a polynomial equation.
  * Use the Rational Zero Theorem to find rational zeros.
  * Find zeros of a polynomial function.
  * Use the Linear Factorization Theorem to find polynomials with given zeros.
  * Use Descartes’ Rule of Signs.
  * Solve real-world applications of polynomial equations.

A new bakery offers decorated sheet cakes for children’s birthday parties and other special occasions. The bakery wants the volume of a small cake to be 351 cubic inches. The cake is in the shape of a rectangular solid. They want the length of the cake to be four inches longer than the width of the cake and the height of the cake to be one-third of the width. What should the dimensions of the cake pan be?

This problem can be solved by writing a cubic function and solving a cubic equation for the volume of the cake. In this section, we will discuss a variety of tools for writing polynomial functions and solving polynomial equations.

### Evaluating a Polynomial Using the Remainder Theorem

In the last section, we learned how to divide polynomials. We can now use polynomial division to evaluate polynomials using the Remainder Theorem. If the polynomial is divided by  x–k, x–k, the remainder may be found quickly by evaluating the polynomial function at  k, k, that is,  f( k ) f( k ) Let’s walk through the proof of the theorem.

Recall that the Division Algorithm states that, given a polynomial dividend  f(x) f(x) and a non-zero polynomial divisor  d(x) d(x) where the degree of  d(x) d(x) is less than or equal to the degree of  f(x), f(x), there exist unique polynomials  q(x) q(x) and  r(x) r(x) such that

f(x)=d(x)q(x)+r(x) f(x)=d(x)q(x)+r(x)

If the divisor,  d(x), d(x), is  x−k, x−k, this takes the form

f(x)=(x−k)q(x)+r f(x)=(x−k)q(x)+r

Since the divisor  x−k x−k is linear, the remainder will be a constant,  r. r. And, if we evaluate this for  x=k, x=k, we have

f(k)=(k−k)q(k)+r =0⋅q(k)+r =r f(k)=(k−k)q(k)+r =0⋅q(k)+r =r

In other words,  f(k) f(k) is the remainder obtained by dividing  f(x) f(x) by  x−k. x−k.

###  The Remainder Theorem

If a polynomial  f(x) f(x) is divided by  x−k, x−k, then the remainder is the value  f(k). f(k).

###  How To

**Given a polynomial function f, f, evaluate  f( x ) f( x ) at  x=k x=k using the Remainder Theorem.**

  1. Use synthetic division to divide the polynomial by  x−k. x−k.
  2. The remainder is the value  f(k). f(k).

###  Example  1

#### Using the Remainder Theorem to Evaluate a Polynomial

Use the Remainder Theorem to evaluate  f(x)=6 x 4 − x 3 −15 x 2 +2x−7 f(x)=6 x 4 − x 3 −15 x 2 +2x−7 at  x=2. x=2.

####  Solution

To find the remainder using the Remainder Theorem, use synthetic division to divide the polynomial by  x−2. x−2.

2 6 −1 −15 2 −7 12 22 14 32 6 11 7 16 25 2 6 −1 −15 2 −7 12 22 14 32 6 11 7 16 25

The remainder is 25. Therefore,  f(2)=25. f(2)=25.

#### Analysis 

We can check our answer by evaluating  f(2). f(2).

f(x)=6 x 4 − x 3 −15 x 2 +2x−7 f(2)=6 (2) 4 − (2) 3 −15 (2) 2 +2(2)−7 =25 f(x)=6 x 4 − x 3 −15 x 2 +2x−7 f(2)=6 (2) 4 − (2) 3 −15 (2) 2 +2(2)−7 =25

###  Try It  #1

Use the Remainder Theorem to evaluate  f(x)=2 x 5 −3 x 4 −9 x 3 +8 x 2 +2 f(x)=2 x 5 −3 x 4 −9 x 3 +8 x 2 +2 at  x=−3. x=−3.

### Using the Factor Theorem to Solve a Polynomial Equation

The **Factor Theorem** is another theorem that helps us analyze polynomial equations. It tells us how the zeros of a polynomial are related to the factors. Recall that the Division Algorithm tells us

f(x)=(x−k)q(x)+r. f(x)=(x−k)q(x)+r.

If  k k is a zero, then the remainder  r r is  f(k)=0 f(k)=0 and  f(x)=(x−k)q(x)+0 f(x)=(x−k)q(x)+0 or  f(x)=(x−k)q(x). f(x)=(x−k)q(x).

Notice, written in this form,  x−k x−k is a factor of  f(x). f(x). We can conclude if  k k is a zero of  f(x), f(x), then  x−k x−k is a factor of  f(x). f(x).

Similarly, if  x−k x−k is a factor of  f(x), f(x), then the remainder of the Division Algorithm  f(x)=(x−k)q(x)+r f(x)=(x−k)q(x)+r is 0. This tells us that  k k is a zero.

This pair of implications is the Factor Theorem. As we will soon see, a polynomial of degree  n n in the complex number system will have  n n zeros. We can use the Factor Theorem to completely factor a polynomial into the product of  n n factors. Once the polynomial has been completely factored, we can easily determine the zeros of the polynomial.

###  The Factor Theorem

According to the Factor Theorem,  k k is a zero of  f(x) f(x) if and only if  (x−k) (x−k) is a factor of  f(x). f(x).

###  How To

**Given a factor and a third-degree polynomial, use the Factor Theorem to factor the polynomial.**

  1. Use synthetic division to divide the polynomial by  (x−k). (x−k).
  2. Confirm that the remainder is 0.
  3. Write the polynomial as the product of  (x−k) (x−k) and the quadratic quotient.
  4. If possible, factor the quadratic.
  5. Write the polynomial as the product of factors.

###  Example  2

#### Using the Factor Theorem to Solve a Polynomial Equation

Show that  (x+2) (x+2) is a factor of  x 3 −6 x 2 −x+30. x 3 −6 x 2 −x+30. Find the remaining factors. Use the factors to determine the zeros of the polynomial.

####  Solution

We can use synthetic division to show that  (x+2) (x+2) is a factor of the polynomial.  

−2 1 −6 −1 30 −2 16 −30 1 −8 15 0 −2 1 −6 −1 30 −2 16 −30 1 −8 15 0

The remainder is zero, so  (x+2) (x+2) is a factor of the polynomial. We can use the Division Algorithm to write the polynomial as the product of the divisor and the quotient:

(x+2)( x 2 −8x+15) (x+2)( x 2 −8x+15)

We can factor the quadratic factor to write the polynomial as

(x+2)(x−3)(x−5) (x+2)(x−3)(x−5)

By the Factor Theorem, the zeros of  x 3 −6 x 2 −x+30 x 3 −6 x 2 −x+30 are –2, 3, and 5.

###  Try It  #2

Use the Factor Theorem to find the zeros of  f(x)= x 3 +4 x 2 −4x−16 f(x)= x 3 +4 x 2 −4x−16 given that  (x−2) (x−2) is a factor of the polynomial.

### Using the Rational Zero Theorem to Find Rational Zeros

Another use for the Remainder Theorem is to test whether a rational number is a zero for a given polynomial. But first we need a pool of rational numbers to test. The Rational Zero Theorem helps us to narrow down the number of possible rational zeros using the ratio of the factors of the constant term and factors of the leading coefficient of the polynomial

Consider a quadratic function with two zeros,  x= 2 5 x= 2 5 and  x= 3 4 . x= 3 4 . By the Factor Theorem, these zeros have factors associated with them. Let us set each factor equal to 0, and then construct the original quadratic function absent its stretching factor.

![This image shows x minus two fifths equals 0 or x minus three fourths equals 0. Beside this math is the sentence, 'Set each factor equal to 0.' Next it shows that five x minus 2 equals 0 or 4 x minus 3 equals 0. Beside this math is the sentence, 'Multiply both sides of the equation to eliminate fractions.' Next it shows that f of x is equal to \(5 x minus 2\) times \(4 x minus 3\). Beside this math is the sentence, 'Create the quadratic function, multiplying the factors.' Next it shows f of x equals 20 x squared minus 23 x plus 6. Beside this math is the sentence, 'Expand the polynomial.' The last equation shows f of x equals \(5 times 4\) times x squared minus 23 x plus \(2 times 3\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8ddb06662c0e9acecd2997f3368bd15b4774f0ca)

Notice that two of the factors of the constant term, 6, are the two numerators from the original rational roots: 2 and 3. Similarly, two of the factors from the leading coefficient, 20, are the two denominators from the original rational roots: 5 and 4.

We can infer that the numerators of the rational roots will always be factors of the constant term and the denominators will be factors of the leading coefficient. This is the essence of the Rational Zero Theorem; it is a means to give us a pool of possible rational zeros.

###  The Rational Zero Theorem

The Rational Zero Theorem states that, if the polynomial  f(x)= a n x n + a n−1 x n−1 +...+ a 1 x+ a 0 f(x)= a n x n + a n−1 x n−1 +...+ a 1 x+ a 0 has integer coefficients, then every rational zero of  f(x) f(x) has the form  p q p q where  p p is a factor of the constant term  a 0 a 0 and  q q is a factor of the leading coefficient  a n . a n .

When the leading coefficient is 1, the possible rational zeros are the factors of the constant term.

###  How To

**Given a polynomial function f(x), f(x), use the Rational Zero Theorem to find rational zeros.**

  1. Determine all factors of the constant term and all factors of the leading coefficient.
  2. Determine all possible values of  p q , p q , where  p p is a factor of the constant term and  q q is a factor of the leading coefficient. Be sure to include both positive and negative candidates.
  3. Determine which possible zeros are actual zeros by evaluating each case of  f( p q ). f( p q ).

###  Example  3

#### Listing All Possible Rational Zeros

List all possible rational zeros of  f(x)=2 x 4 −5 x 3 + x 2 −4. f(x)=2 x 4 −5 x 3 + x 2 −4.

####  Solution

The only possible rational zeros of  f(x) f(x) are the quotients of the factors of the last term, –4, and the factors of the leading coefficient, 2. 

The constant term is –4; the factors of –4 are  p=±1,±2,±4. p=±1,±2,±4.

The leading coefficient is 2; the factors of 2 are  q=±1,±2. q=±1,±2.

If any of the four real zeros are rational zeros, then they will be of one of the following factors of –4 divided by one of the factors of 2.

p q =± 1 1 ,± 1 2 p q =± 2 1 ,± 2 2 p q =± 4 1 ,± 4 2 p q =± 1 1 ,± 1 2 p q =± 2 1 ,± 2 2 p q =± 4 1 ,± 4 2

Note that  2 2 =1 2 2 =1 and  4 2 =2, 4 2 =2, which have already been listed. So we can shorten our list.

p q = Factors of the last Factors of the first =±1,±2,±4,± 1 2 p q = Factors of the last Factors of the first =±1,±2,±4,± 1 2

###  Example  4

#### Using the Rational Zero Theorem to Find Rational Zeros

Use the Rational Zero Theorem to find the rational zeros of  f(x)=2 x 3 + x 2 −4x+1. f(x)=2 x 3 + x 2 −4x+1.

####  Solution

The Rational Zero Theorem tells us that if  p q p q is a zero of  f(x), f(x), then  p p is a factor of 1 and  q q is a factor of 2. 

p q = factor of constant term factor of leading coefficient = factor of 1 factor of 2 p q = factor of constant term factor of leading coefficient = factor of 1 factor of 2

The factors of 1 are  ±1 ±1 and the factors of 2 are  ±1 ±1 and  ±2. ±2. The possible values for  p q p q are  ±1 ±1 and  ± 1 2 . ± 1 2 . These are the possible rational zeros for the function. We can determine which of the possible zeros are actual zeros by substituting these values for  x x in  f(x). f(x).

f(−1)=2 (−1) 3 + (−1) 2 −4(−1)+1=4 f(1)=2 (1) 3 + (1) 2 −4(1)+1=0 f( − 1 2 )=2 ( − 1 2 ) 3 + ( − 1 2 ) 2 −4( − 1 2 )+1=3 f( 1 2 )=2 ( 1 2 ) 3 + ( 1 2 ) 2 −4( 1 2 )+1=− 1 2 f(−1)=2 (−1) 3 + (−1) 2 −4(−1)+1=4 f(1)=2 (1) 3 + (1) 2 −4(1)+1=0 f( − 1 2 )=2 ( − 1 2 ) 3 + ( − 1 2 ) 2 −4( − 1 2 )+1=3 f( 1 2 )=2 ( 1 2 ) 3 + ( 1 2 ) 2 −4( 1 2 )+1=− 1 2

Of those,  −1,− 1 2 , and  1 2 −1,− 1 2 , and  1 2 are not zeros of  f(x). f(x). 1 is the only rational zero of  f(x). f(x).

###  Try It  #3

Use the Rational Zero Theorem to find the rational zeros of  f(x)= x 3 −5 x 2 +2x+1. f(x)= x 3 −5 x 2 +2x+1.

### Finding the Zeros of Polynomial Functions

The Rational Zero Theorem helps us to narrow down the list of possible rational zeros for a polynomial function. Once we have done this, we can use synthetic division repeatedly to determine all of the zeros of a polynomial function.

###  How To

**Given a polynomial function f, f, use synthetic division to find its zeros.**

  1. Use the Rational Zero Theorem to list all possible rational zeros of the function.
  2. Use synthetic division to evaluate a given possible zero by synthetically dividing the candidate into the polynomial. If the remainder is 0, the candidate is a zero. If the remainder is not zero, discard the candidate.
  3. Repeat step two using the quotient found with synthetic division. If possible, continue until the quotient is a quadratic.
  4. Find the zeros of the quadratic function. Two possible methods for solving quadratics are factoring and using the quadratic formula.

###  Example  5

#### Finding the Zeros of a Polynomial Function with Repeated Real Zeros

Find the zeros of  f(x)=4 x 3 −3x−1. f(x)=4 x 3 −3x−1.

####  Solution

The Rational Zero Theorem tells us that if  p q p q is a zero of  f(x), f(x), then  p p is a factor of –1 and  q q is a factor of 4. 

p q = factor of constant term factor of leading coefficient = factor of –1 factor of 4 p q = factor of constant term factor of leading coefficient = factor of –1 factor of 4

The factors of  –1 –1 are  ±1 ±1 and the factors of  4 4 are  ±1,±2, ±1,±2, and  ±4. ±4. The possible values for  p q p q are  ±1,± 1 2 , ±1,± 1 2 , and  ± 1 4 . ± 1 4 . These are the possible rational zeros for the function. We will use synthetic division to evaluate each possible zero until we find one that gives a remainder of 0. Let’s begin with 1.

1 4 0 −3 −1 4 4 1 4 4 1 0 1 4 0 −3 −1 4 4 1 4 4 1 0

Dividing by  (x−1) (x−1) gives a remainder of 0, so 1 is a zero of the function. The polynomial can be written as

(x−1)(4 x 2 +4x+1). (x−1)(4 x 2 +4x+1).

The quadratic is a perfect square.  f(x) f(x) can be written as

(x−1) (2x+1) 2 . (x−1) (2x+1) 2 .

We already know that 1 is a zero. The other zero will have a multiplicity of 2 because the factor is squared. To find the other zero, we can set the factor equal to 0.

2x+1=0 x=− 1 2 2x+1=0 x=− 1 2

The zeros of the function are 1 and  − 1 2 − 1 2 with multiplicity 2.

#### Analysis 

Look at the graph of the function  f f in [Figure 1](<3-6-zeros-of-polynomial-functions#Figure_03_06_001>). Notice, at  x=−0.5, x=−0.5, the graph bounces off the _x_ -axis, indicating the even multiplicity (2,4,6…) for the zero  −0.5. −0.5. At  x=1, x=1, the graph crosses the _x_ -axis, indicating the odd multiplicity (1,3,5…) for the zero  x=1. x=1.

![Graph of a polynomial that have its local maximum at \(-0.5, 0\) labeled as “Bounce” and its x-intercept at \(1, 0\) labeled, “Cross”.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/44c0231c001a2247d1310ed865d9ef893c11241f) Figure  1

### Using the Fundamental Theorem of Algebra

Now that we can find rational zeros for a polynomial function, we will look at a theorem that discusses the number of complex zeros of a polynomial function. The **Fundamental Theorem of Algebra** tells us that every polynomial function has at least one complex zero. This theorem forms the foundation for solving polynomial equations.

Suppose  f f is a polynomial function of degree four, and  f(x)=0. f(x)=0. The Fundamental Theorem of Algebra states that there is at least one complex solution, call it  c 1 . c 1 . By the Factor Theorem, we can write  f(x) f(x) as a product of  x− c 1 x− c 1 and a polynomial quotient. Since  x− c 1 x− c 1 is linear, the polynomial quotient will be of degree three. Now we apply the Fundamental Theorem of Algebra to the third-degree polynomial quotient. It will have at least one complex zero, call it  c 2 . c 2 . So we can write the polynomial quotient as a product of  x− c 2 x− c 2 and a new polynomial quotient of degree two. Continue to apply the Fundamental Theorem of Algebra until all of the zeros are found. There will be four of them and each one will yield a factor of  f(x). f(x).

###  The Fundamental Theorem of Algebra states that, if _f(x)_ is a polynomial of degree _n > 0_, then _f(x)_ has at least one complex zero.

We can use this theorem to argue that, if  f(x) f(x) is a polynomial of degree  n>0, n>0, and  a a is a non-zero real number, then  f(x) f(x) has exactly  n n linear factors

f(x)=a(x− c 1 )(x− c 2 )...(x− c n ) f(x)=a(x− c 1 )(x− c 2 )...(x− c n )

where  c 1 , c 2 ,..., c n c 1 , c 2 ,..., c n are complex numbers. Therefore,  f(x) f(x) has  n n roots if we allow for multiplicities.

###  Q&A

**Does every polynomial have at least one imaginary zero?**

_No. A complex number is not necessarily imaginary. Real numbers are also complex numbers._

###  Example  6

#### Finding the Zeros of a Polynomial Function with Complex Zeros

Find the zeros of  f(x)=3 x 3 +9 x 2 +x+3. f(x)=3 x 3 +9 x 2 +x+3.

####  Solution

The Rational Zero Theorem tells us that if  p q p q is a zero of  f(x), f(x), then  p p is a factor of 3 and  q q is a factor of 3. 

p q = factor of constant term factor of leading coefficient = factor of 3 factor of 3 p q = factor of constant term factor of leading coefficient = factor of 3 factor of 3

The factors of 3 are  ±1 ±1 and  ±3. ±3. The possible values for  p q , p q , and therefore the possible rational zeros for the function, are  ±3,±1, and ± 1 3 . ±3,±1, and ± 1 3 . We will use synthetic division to evaluate each possible zero until we find one that gives a remainder of 0. Let’s begin with –3.

−3 3 9 1 3 −9 0 −3 3 0 1 0 −3 3 9 1 3 −9 0 −3 3 0 1 0

Dividing by  (x+3) (x+3) gives a remainder of 0, so –3 is a zero of the function. The polynomial can be written as

(x+3)(3 x 2 +1) (x+3)(3 x 2 +1)

We can then set the quadratic equal to 0 and solve to find the other zeros of the function.

3 x 2 +1=0 x 2 =− 1 3 x=± − 1 3 =± i 3 3 3 x 2 +1=0 x 2 =− 1 3 x=± − 1 3 =± i 3 3

The zeros of  f(x) f(x) are –3 and  ± i 3 3 . ± i 3 3 .

#### Analysis 

Look at the graph of the function  f f in [Figure 2](<3-6-zeros-of-polynomial-functions#Figure_03_06_002>). Notice that, at  x=−3, x=−3, the graph crosses the _x_ -axis, indicating an odd multiplicity (1) for the zero  x=–3. x=–3. Also note the presence of the two turning points. This means that, since there is a 3rd degree polynomial, we are looking at the maximum number of turning points. So, the end behavior of increasing without bound to the right and decreasing without bound to the left will continue. Thus, all the _x_ -intercepts for the function are shown. So either the multiplicity of  x=−3 x=−3 is 1 and there are two complex solutions, which is what we found, or the multiplicity at  x=−3 x=−3 is three. Either way, our result is correct. 

![Graph of a polynomial with its x-intercept at \(-3, 0\) labeled as “Cross”.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/dc5041a99905fd98ab862a51011d7a13c69321c4) Figure  2

###  Try It  #4

Find the zeros of  f(x)=2 x 3 +5 x 2 −11x+4. f(x)=2 x 3 +5 x 2 −11x+4.

### Using the Linear Factorization Theorem to Find Polynomials with Given Zeros

A vital implication of the Fundamental Theorem of Algebra, as we stated above, is that a polynomial function of degree  n n will have  n n zeros in the set of complex numbers, if we allow for multiplicities. This means that we can factor the polynomial function into  n n factors. The Linear Factorization Theorem tells us that a polynomial function will have the same number of factors as its degree, and that each factor will be in the form  (x−c), (x−c), where  c c is a complex number.

Let  f f be a polynomial function with real coefficients, and suppose  a+bi, b≠0, a+bi, b≠0, is a zero of  f(x). f(x). Then, by the Factor Theorem,  x−(a+bi) x−(a+bi) is a factor of  f(x). f(x). For  f f to have real coefficients,  x−(a−bi) x−(a−bi) must also be a factor of  f(x). f(x). This is true because any factor other than  x−(a−bi), x−(a−bi), when multiplied by  x−(a+bi), x−(a+bi), will leave imaginary components in the product. Only multiplication with conjugate pairs will eliminate the imaginary parts and result in real coefficients. In other words, if a polynomial function  f f with real coefficients has a complex zero  a+bi, a+bi, then the complex conjugate  a−bi a−bi must also be a zero of  f(x). f(x). This is called the Complex Conjugate Theorem.

###  Complex Conjugate Theorem

According to the Linear Factorization Theorem**,** a polynomial function will have the same number of factors as its degree, and each factor will be in the form  (x−c), (x−c), where  c c is a complex number.

If the polynomial function  f f has real coefficients and a complex zero in the form  a+bi, a+bi, then the complex conjugate of the zero,  a−bi, a−bi, is also a zero.

###  How To

**Given the zeros of a polynomial function f f and a point _(c, f(c))_ on the graph of  f, f, use the Linear Factorization Theorem to find the polynomial function.**

  1. Use the zeros to construct the linear factors of the polynomial.
  2. Multiply the linear factors to expand the polynomial.
  3. Substitute  ( c,f( c ) ) ( c,f( c ) ) into the function to determine the leading coefficient.
  4. Simplify.

###  Example  7

#### Using the Linear Factorization Theorem to Find a Polynomial with Given Zeros

Find a fourth degree polynomial with real coefficients that has zeros of –3, 2,  i, i, such that  f(−2)=100. f(−2)=100.

####  Solution

Because  x=i x=i is a zero, by the Complex Conjugate Theorem  x=–i x=–i is also a zero. The polynomial must have factors of  (x+3),(x−2),(x−i), (x+3),(x−2),(x−i), and  (x+i). (x+i). Since we are looking for a degree 4 polynomial, and now have four zeros, we have all four factors. Let’s begin by multiplying these factors.

f(x)=a(x+3)(x−2)(x−i)(x+i) f(x)=a( x 2 +x−6)( x 2 +1) f(x)=a( x 4 + x 3 −5 x 2 +x−6) f(x)=a(x+3)(x−2)(x−i)(x+i) f(x)=a( x 2 +x−6)( x 2 +1) f(x)=a( x 4 + x 3 −5 x 2 +x−6)

We need to find _a_ to ensure  f(–2)=100. f(–2)=100. Substitute  x=–2 x=–2 and  f(2)=100 f(2)=100 into  f(x). f(x).

100=a( (−2) 4 + (−2) 3 −5 (−2) 2 +(−2)−6) 100=a(−20) −5=a 100=a( (−2) 4 + (−2) 3 −5 (−2) 2 +(−2)−6) 100=a(−20) −5=a

So the polynomial function is

f(x)=−5( x 4 + x 3 −5 x 2 +x−6) f(x)=−5( x 4 + x 3 −5 x 2 +x−6)

or

f(x)=−5 x 4 −5 x 3 +25 x 2 −5x+30 f(x)=−5 x 4 −5 x 3 +25 x 2 −5x+30

#### Analysis 

We found that both  i i and  −i −i were zeros, but only one of these zeros needed to be given. If  i i is a zero of a polynomial with real coefficients, then  −i −i must also be a zero of the polynomial because  −i −i is the complex conjugate of  i. i.

###  Q&A

**If 2+3i 2+3i were given as a zero of a polynomial with real coefficients, would  2−3i 2−3i also need to be a zero?**

_Yes. When any complex number with an imaginary component is given as a zero of a polynomial with real coefficients, the conjugate must also be a zero of the polynomial._

###  Try It  #5

Find a third degree polynomial with real coefficients that has zeros of 5 and  −2i −2i such that  f(1)=10. f(1)=10.

### Using Descartes’ Rule of Signs

There is a straightforward way to determine the possible numbers of positive and negative real zeros for any polynomial function. If the polynomial is written in descending order,**Descartes’ Rule of Signs** tells us of a relationship between the number of sign changes in  f(x) f(x) and the number of positive real zeros. For example, the polynomial function below has one sign change.

![The function, f\(x\)=x^4+x^3+x^2+x-1, has one sign change between x and -1.`](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/091b2d6b486be3d41b3695544dfdd3cf6d09c97b)

This tells us that the function must have 1 positive real zero.

There is a similar relationship between the number of sign changes in  f(−x) f(−x) and the number of negative real zeros.

![The function, f\(-x\)=\(-x\)^4+\(-x\)^3+\(-x\)^2+\(-x\)-1=+ x^4-x^3+x^2-x-1, has three sign changes between x^4 and x^3, x^3 and x^2, and x^2 and x.`](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3dc71e35741d82539bfd3dd48ae16c450899ac10)

In this case,  f(−x) f(−x) has 3 sign changes. This tells us that  f(x) f(x) could have 3 or 1 negative real zeros.

###  Descartes’ Rule of Signs

According to Descartes’ Rule of Signs, if we let  f(x)= a n x n + a n−1 x n−1 +...+ a 1 x+ a 0 f(x)= a n x n + a n−1 x n−1 +...+ a 1 x+ a 0 be a polynomial function with real coefficients:

  * The number of positive real zeros is either equal to the number of sign changes of  f(x) f(x) or is less than the number of sign changes by an even integer.
  * The number of negative real zeros is either equal to the number of sign changes of  f(−x) f(−x) or is less than the number of sign changes by an even integer.

###  Example  8

#### Using Descartes’ Rule of Signs

Use Descartes’ Rule of Signs to determine the possible numbers of positive and negative real zeros for  f(x)=− x 4 −3 x 3 +6 x 2 −4x−12. f(x)=− x 4 −3 x 3 +6 x 2 −4x−12.

####  Solution

Begin by determining the number of sign changes.

![The function, f\(x\)=-x^4-3x^3+6x^2-4x-12, has two sign change between -3x^3 and 6x^2, and 6x^2 and -4x.`](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/60c3950699892782eefdd1be06740af0657a007a) Figure  3

There are two sign changes, so there are either 2 or 0 positive real roots. Next, we examine  f(−x) f(−x) to determine the number of negative real roots.

f(−x)=− (−x) 4 −3 (−x) 3 +6 (−x) 2 −4(−x)−12 f(−x)=− x 4 +3 x 3 +6 x 2 +4x−12 f(−x)=− (−x) 4 −3 (−x) 3 +6 (−x) 2 −4(−x)−12 f(−x)=− x 4 +3 x 3 +6 x 2 +4x−12

![The function, f\(-x\)=-x^4+3x^3+6x^2+4x-12, has two sign change between -x^4 and 3x^3, and 4x and -12.`](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f07259b9deeb90b9280394014d79a88409a125fe) Figure  4

Again, there are two sign changes, so there are either 2 or 0 negative real roots.

There are four possibilities, as we can see in [Table 1](<3-6-zeros-of-polynomial-functions#Table_03_06_01>).

Positive Real Zeros | Negative Real Zeros | Complex Zeros | Total Zeros  
---|---|---|---  
2 | 2 | 0 | 4  
2 | 0 | 2 | 4  
0 | 2 | 2 | 4  
0 | 0 | 4 | 4  
  
Table  1

#### Analysis 

We can confirm the numbers of positive and negative real roots by examining a graph of the function. See [Figure 5](<3-6-zeros-of-polynomial-functions#Figure_03_06_007>). We can see from the graph that the function has 0 positive real roots and 2 negative real roots.

![Graph of f\(x\)=-x^4-3x^3+6x^2-4x-12 with x-intercepts at -4.42 and -1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/89af8a9761382e78793c93331fe32ac2fd3c169e) Figure  5

###  Try It  #6

Use Descartes’ Rule of Signs to determine the maximum possible numbers of positive and negative real zeros for  f(x)=2 x 4 −10 x 3 +11 x 2 −15x+12. f(x)=2 x 4 −10 x 3 +11 x 2 −15x+12. Use a graph to verify the numbers of positive and negative real zeros for the function.

### Solving Real-World Applications 

We have now introduced a variety of tools for solving polynomial equations. Let’s use these tools to solve the bakery problem from the beginning of the section.

###  Example  9

#### Solving Polynomial Equations

A new bakery offers decorated sheet cakes for children’s birthday parties and other special occasions. The bakery wants the volume of a small cake to be 351 cubic inches. The cake is in the shape of a rectangular solid. They want the length of the cake to be four inches longer than the width of the cake and the height of the cake to be one-third of the width. What should the dimensions of the cake pan be?

####  Solution

Begin by writing an equation for the volume of the cake. The volume of a rectangular solid is given by  V=lwh. V=lwh. We were given that the length must be four inches longer than the width, so we can express the length of the cake as  l=w+4. l=w+4. We were given that the height of the cake is one-third of the width, so we can express the height of the cake as  h= 1 3 w. h= 1 3 w. Let’s write the volume of the cake in terms of width of the cake.

V=(w+4)(w)( 1 3 w) V= 1 3 w 3 + 4 3 w 2 V=(w+4)(w)( 1 3 w) V= 1 3 w 3 + 4 3 w 2

Substitute the given volume into this equation.

351= 1 3 w 3 + 4 3 w 2 Substitute 351 for V. 1053= w 3 +4 w 2 Multiply both sides by 3. 0= w 3 +4 w 2 −1053 Subtract 1053 from both sides. 351= 1 3 w 3 + 4 3 w 2 Substitute 351 for V. 1053= w 3 +4 w 2 Multiply both sides by 3. 0= w 3 +4 w 2 −1053 Subtract 1053 from both sides.

Descartes' rule of signs tells us there is one positive solution. The Rational Zero Theorem tells us that the possible rational zeros are  ±1,±3,±9,±13,±27,±39,±81,±117,±351, ±1,±3,±9,±13,±27,±39,±81,±117,±351, and  ±1053. ±1053. We can use synthetic division to test these possible zeros. Only positive numbers make sense as dimensions for a cake, so we need not test any negative values. Let’s begin by testing values that make the most sense as dimensions for a small sheet cake. Use synthetic division to check  x=1. x=1.

1 1 4 0 −1053 1 5 5 1 5 5 −1048 1 1 4 0 −1053 1 5 5 1 5 5 −1048

Since 1 is not a solution, we will check  x=3. x=3.

![.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5ec7bc1d59fb4e888052fdb3602dd8082c8f6a77)

Since 3 is not a solution either, we will test  x=9. x=9.

![.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/50eb57e9e957844ce2669f65eebecba4f3b82cac)

Synthetic division gives a remainder of 0, so 9 is a solution to the equation. We can use the relationships between the width and the other dimensions to determine the length and height of the sheet cake pan.

l=w+4=9+4=13 and h= 1 3 w= 1 3 (9)=3 l=w+4=9+4=13 and h= 1 3 w= 1 3 (9)=3

The sheet cake pan should have dimensions 13 inches by 9 inches by 3 inches.

###  Try It  #7

A shipping container in the shape of a rectangular solid must have a volume of 84 cubic meters. The client tells the manufacturer that, because of the contents, the length of the container must be one meter longer than the width, and the height must be one meter greater than twice the width. What should the dimensions of the container be?

###  Media

Access these online resources for additional instruction and practice with zeros of polynomial functions.

  * [Real Zeros, Factors, and Graphs of Polynomial Functions](<http://openstax.org/l/realzeros>)
  * [Complex Factorization Theorem](<http://openstax.org/l/factortheorem>)
  * [Find the Zeros of a Polynomial Function](<http://openstax.org/l/findthezeros>)
  * [Find the Zeros of a Polynomial Function 2](<http://openstax.org/l/findthezeros2>)
  * [Find the Zeros of a Polynomial Function 3](<http://openstax.org/l/findthezeros3>)

###  3.6 Section Exercises

#### Verbal

[1](<chapter-3>). 

Describe a use for the Remainder Theorem.

2. 

Explain why the Rational Zero Theorem does not guarantee finding zeros of a polynomial function.

[3](<chapter-3>). 

What is the difference between rational and real zeros?

4. 

If Descartes’ Rule of Signs reveals a no change of signs or one sign of changes, what specific conclusion can be drawn?

[5](<chapter-3>). 

If synthetic division reveals a zero, why should we try that value again as a possible solution?

#### Algebraic

For the following exercises, use the Remainder Theorem to find the remainder.

6. 

( x 4 −9 x 2 +14 )÷( x−2 ) ( x 4 −9 x 2 +14 )÷( x−2 )

[7](<chapter-3>). 

( 3 x 3 −2 x 2 +x−4 )÷( x+3 ) ( 3 x 3 −2 x 2 +x−4 )÷( x+3 )

8. 

( x 4 +5 x 3 −4x−17 )÷( x+1 ) ( x 4 +5 x 3 −4x−17 )÷( x+1 )

[9](<chapter-3>). 

( −3 x 2 +6x+24 )÷( x−4 ) ( −3 x 2 +6x+24 )÷( x−4 )

10. 

( 5 x 5 −4 x 4 +3 x 3 −2 x 2 +x−1 )÷( x+6 ) ( 5 x 5 −4 x 4 +3 x 3 −2 x 2 +x−1 )÷( x+6 )

[11](<chapter-3>). 

( x 4 −1 )÷( x−4 ) ( x 4 −1 )÷( x−4 )

12. 

( 3 x 3 +4 x 2 −8x+2 )÷( x−3 ) ( 3 x 3 +4 x 2 −8x+2 )÷( x−3 )

[13](<chapter-3>). 

( 4 x 3 +5 x 2 −2x+7 )÷( x+2 ) ( 4 x 3 +5 x 2 −2x+7 )÷( x+2 )

For the following exercises, use the Factor Theorem to find all real zeros for the given polynomial function and one factor.

14. 

f(x)=2 x 3 −9 x 2 +13x−6;x−1 f(x)=2 x 3 −9 x 2 +13x−6;x−1

[15](<chapter-3>). 

f(x)=2 x 3 + x 2 −5x+2;x+2 f(x)=2 x 3 + x 2 −5x+2;x+2

16. 

f(x)=3 x 3 + x 2 −20x+12;x+3 f(x)=3 x 3 + x 2 −20x+12;x+3

[17](<chapter-3>). 

f(x)=2 x 3 +3 x 2 +x+6;x+2 f(x)=2 x 3 +3 x 2 +x+6;x+2

18. 

f(x)=−5 x 3 +16 x 2 −9;x−3 f(x)=−5 x 3 +16 x 2 −9;x−3

[19](<chapter-3>). 

x 3 +3 x 2 +4x+12;x+3 x 3 +3 x 2 +4x+12;x+3

20. 

4 x 3 −7x+3;x−1 4 x 3 −7x+3;x−1

[21](<chapter-3>). 

2 x 3 +5 x 2 −12x−30,​2x+5 2 x 3 +5 x 2 −12x−30,​2x+5

For the following exercises, use the Rational Zero Theorem to find all real zeros.

22. 

x 3 −3 x 2 −10x+24=0 x 3 −3 x 2 −10x+24=0

[23](<chapter-3>). 

2 x 3 +7 x 2 −10x−24=0 2 x 3 +7 x 2 −10x−24=0

24. 

x 3 +2 x 2 −9x−18=0 x 3 +2 x 2 −9x−18=0

[25](<chapter-3>). 

x 3 +5 x 2 −16x−80=0 x 3 +5 x 2 −16x−80=0

26. 

x 3 −3 x 2 −25x+75=0 x 3 −3 x 2 −25x+75=0

[27](<chapter-3>). 

2 x 3 −3 x 2 −32x−15=0 2 x 3 −3 x 2 −32x−15=0

28. 

2 x 3 + x 2 −7x−6=0 2 x 3 + x 2 −7x−6=0

[29](<chapter-3>). 

2 x 3 −3 x 2 −x+1=0 2 x 3 −3 x 2 −x+1=0

30. 

3 x 3 − x 2 −11x−6=0 3 x 3 − x 2 −11x−6=0

[31](<chapter-3>). 

2 x 3 −5 x 2 +9x−9=0 2 x 3 −5 x 2 +9x−9=0

32. 

2 x 3 −3 x 2 +4x+3=0 2 x 3 −3 x 2 +4x+3=0

[33](<chapter-3>). 

x 4 −2 x 3 −7 x 2 +8x+12=0 x 4 −2 x 3 −7 x 2 +8x+12=0

34. 

x 4 +2 x 3 −9 x 2 −2x+8=0 x 4 +2 x 3 −9 x 2 −2x+8=0

[35](<chapter-3>). 

4 x 4 +4 x 3 −25 x 2 −x+6=0 4 x 4 +4 x 3 −25 x 2 −x+6=0

36. 

2 x 4 −3 x 3 −15 x 2 +32x−12=0 2 x 4 −3 x 3 −15 x 2 +32x−12=0

[37](<chapter-3>). 

x 4 +2 x 3 −4 x 2 −10x−5=0 x 4 +2 x 3 −4 x 2 −10x−5=0

38. 

4 x 3 −3x+1=0 4 x 3 −3x+1=0

[39](<chapter-3>). 

8 x 4 +26 x 3 +39 x 2 +26x+6 8 x 4 +26 x 3 +39 x 2 +26x+6

For the following exercises, find all complex solutions (real and non-real).

40. 

x 3 + x 2 +x+1=0 x 3 + x 2 +x+1=0

[41](<chapter-3>). 

x 3 −8 x 2 +25x−26=0 x 3 −8 x 2 +25x−26=0

42. 

x 3 +13 x 2 +57x+85=0 x 3 +13 x 2 +57x+85=0

[43](<chapter-3>). 

3 x 3 −4 x 2 +11x+10=0 3 x 3 −4 x 2 +11x+10=0

44. 

x 4 +2 x 3 +22 x 2 +50x−75=0 x 4 +2 x 3 +22 x 2 +50x−75=0

[45](<chapter-3>). 

2 x 3 −3 x 2 +32x+17=0 2 x 3 −3 x 2 +32x+17=0

#### Graphical

For the following exercises, use Descartes’ Rule to determine the possible number of positive and negative solutions. Then graph to confirm which of those possibilities is the actual combination.

46. 

f(x)= x 3 −1 f(x)= x 3 −1

[47](<chapter-3>). 

f(x)= x 4 − x 2 −1 f(x)= x 4 − x 2 −1

48. 

f(x)= x 3 −2 x 2 −5x+6 f(x)= x 3 −2 x 2 −5x+6

[49](<chapter-3>). 

f(x)= x 3 −2 x 2 +x−1 f(x)= x 3 −2 x 2 +x−1

50. 

f(x)= x 4 +2 x 3 −12 x 2 +14x−5 f(x)= x 4 +2 x 3 −12 x 2 +14x−5

[51](<chapter-3>). 

f(x)=2 x 3 +37 x 2 +200x+300 f(x)=2 x 3 +37 x 2 +200x+300

52. 

f(x)= x 3 −2 x 2 −16x+32 f(x)= x 3 −2 x 2 −16x+32

[53](<chapter-3>). 

f(x)=2 x 4 −5 x 3 −5 x 2 +5x+3 f(x)=2 x 4 −5 x 3 −5 x 2 +5x+3

54. 

f(x)=2 x 4 −5 x 3 −14 x 2 +20x+8 f(x)=2 x 4 −5 x 3 −14 x 2 +20x+8

[55](<chapter-3>). 

f(x)=10 x 4 −21 x 2 +11 f(x)=10 x 4 −21 x 2 +11

#### Numeric

For the following exercises, list all possible rational zeros for the functions.

56. 

f(x)= x 4 +3 x 3 −4x+4 f(x)= x 4 +3 x 3 −4x+4

[57](<chapter-3>). 

f(x)=2 x 3 +3 x 2 −8x+5 f(x)=2 x 3 +3 x 2 −8x+5

58. 

f(x)=3 x 3 +5 x 2 −5x+4 f(x)=3 x 3 +5 x 2 −5x+4

[59](<chapter-3>). 

f(x)=6 x 4 −10 x 2 +13x+1 f(x)=6 x 4 −10 x 2 +13x+1

60. 

f(x)=4 x 5 −10 x 4 +8 x 3 + x 2 −8 f(x)=4 x 5 −10 x 4 +8 x 3 + x 2 −8

#### Technology

For the following exercises, use your calculator to graph the polynomial function. Based on the graph, find the rational zeros. All real solutions are rational.

[61](<chapter-3>). 

f(x)=6 x 3 −7 x 2 +1 f(x)=6 x 3 −7 x 2 +1

62. 

f(x)=4 x 3 −4 x 2 −13x−5 f(x)=4 x 3 −4 x 2 −13x−5

[63](<chapter-3>). 

f(x)=8 x 3 −6 x 2 −23x+6 f(x)=8 x 3 −6 x 2 −23x+6

64. 

f(x)=12 x 4 +55 x 3 +12 x 2 −117x+54 f(x)=12 x 4 +55 x 3 +12 x 2 −117x+54

[65](<chapter-3>). 

f(x)=16 x 4 −24 x 3 + x 2 −15x+25 f(x)=16 x 4 −24 x 3 + x 2 −15x+25

#### Extensions

For the following exercises, construct a polynomial function of least degree possible using the given information.

66. 

Real roots: –1, 1, 3 and  ( 2,f( 2 ) )=( 2,4 ) ( 2,f( 2 ) )=( 2,4 )

[67](<chapter-3>). 

Real roots: –1, 1 (with multiplicity 2 and 1) and  ( 2,f( 2 ) )=( 2,4 ) ( 2,f( 2 ) )=( 2,4 )

68. 

Real roots: –2,  1 2 1 2 (with multiplicity 2) and  ( −3,f( −3 ) )=( −3,5 ) ( −3,f( −3 ) )=( −3,5 )

[69](<chapter-3>). 

Real roots:  − 1 2 − 1 2 , 0,  1 2 1 2 and  ( −2,f( −2 ) )=( −2,6 ) ( −2,f( −2 ) )=( −2,6 )

70. 

Real roots: –4, –1, 1, 4 and  ( −2,f( −2 ) )=( −2,10 ) ( −2,f( −2 ) )=( −2,10 )

#### Real-World Applications

For the following exercises, find the dimensions of the box described.

[71](<chapter-3>). 

The length is twice as long as the width. The height is 2 inches greater than the width. The volume is 192 cubic inches.

72. 

The length, width, and height are consecutive whole numbers. The volume is 120 cubic inches.

[73](<chapter-3>). 

The length is one inch more than the width, which is one inch more than the height. The volume is 86.625 cubic inches.

74. 

The length is three times the height and the height is one inch less than the width. The volume is 108 cubic inches.

[75](<chapter-3>). 

The length is 3 inches more than the width. The width is 2 inches more than the height. The volume is 120 cubic inches.

For the following exercises, find the dimensions of the right circular cylinder described.

76. 

The radius is 3 inches more than the height. The volume is  16π 16π cubic inches.

[77](<chapter-3>). 

The height is one less than one half the radius. The volume is  72π 72π cubic meters.

78. 

The radius and height differ by one meter. The radius is larger and the volume is  48π 48π cubic meters.

[79](<chapter-3>). 

The radius and height differ by two meters. The height is greater and the volume is  28.125π 28.125π cubic meters.

80. 

80\. The radius is  1 3 1 3 meter greater than the height. The volume is  98 9 π 98 9 π cubic meters.

