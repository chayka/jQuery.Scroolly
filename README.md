## jQuery.Scroolly, what is it?
Scroolly is a handy jQuery plugin that simplifies greatly scroll-effects scripting.

Scroll-effects are some scripted scenarios that are attuned to web-page scrolling position or direction.

In Scroolly environment scrolling scenario is defined by set of rules that are applied to some DOM elements.

Scroolly tracks viewport scrolling position and direction and applies rules that match some criteria.

So what Scroolly scripting looks like? Here:
```
$('#element').scroolly([
	rule1,
	rule2,
	rule3
]);
```
Rules - are main building bricks of scroll effects. Each rule is a javascript object that consists of some conditions and actions.

Lets look at a simple sample:
```
$('#element').scroolly([{
	from: 'doc-top',
	to: 'doc-bottom',
	css: {
		color: 'red'
	}
}]);
``` 
This very rule means that when viewport is between top document border and bottom document border (and it’s always true so you can omit ‘from’ and ‘to’) the #element gets the defined css styling.

> When conditions are met the actions are taken.

There is thorough documentation in [Wiki](wiki/Home). But before you go there, review the **«Sticky» Scenario** just to catch a grasp of what jQuery.Scroolly is about.

## «Sticky» Scenario
Let's study typical scrolling scenario - «Sticky».

We have some «body» container (#container) that goes right after «header» and before «footer». 

This «body» is headed with «search form» (#element) that we want to stick to viewport top border whenever viewport reaches it. We have pretty big footer, bigger than viewport height. So at some point viewport leaves «body» and we might want to unstick «search form» to leave it behind within «body».

![jQuery.Scroolly Container Scenario](https://raw.githubusercontent.com/chayka/jQuery.Scroolly/master/wiki/container-scenario.png)

Lets see how it is made using jQuery.Scrolly. Lets say «Search form» (#element) is the first DOM child of «body» (#container). Our CSS will be:

```
#container{
	position: relative;
	padding-top: 100px;
}

#element{
	position: absolute;
}
```

Below is appropriate JS code. The reference to the container is supplied as the second param after the rules array:
```
$('#element').scroolly([
{
	to: 'con-top'
	css:{
		top:'0',
		bottom: '',
		position: 'absolute'
	}
},
{
	from: 'con-top',
	to: 'con-bottom - 100el = vp-top',
	css:{
		top: '0',
		bottom: '',
		position: 'fixed'
		
	}
},
{	
	from: 'con-bottom - 100el = vp-top',
	css:{
		top: '',
		bottom: '0',
		position: 'absolute'
	}
}
], $('#container'));
```
## Interested?

Welcome to the [Wiki](https://github.com/chayka/jQuery.Scroolly/wiki/Home) :)