---
title: Streamlining Pre-Visit Inquiries with OpenAgentsBuilder
description: Creating pre-visit inquiries with OAB
order: 20
---

Today’s customers expect seamless, interactive, and efficient experiences—even before they step foot in your office. One of the best ways to deliver on that expectation is by automating your pre-visit inquiry or intake process with **OpenAgentsBuilder**. Below, I’ll walk you through how to set up a simple, AI-powered “Survey Agent” that collects user data, schedules appointments, and even sends email notifications—all from a single, user-friendly platform.

<div style="position: relative; padding-bottom: 117.39130434782608%; height: 0;"><iframe src="https://www.loom.com/embed/f9d00a0b66d84799aea239f0e97e7d5b?sid=c6765a69-8c38-4c11-8cd7-83b98e947578" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>


### **1. Getting Started: Create a New Agent**

1. **Log In**  
   Once you log into OpenAgentsBuilder, click on **New Agent** to start creating your survey or intake form agent from scratch.

   <Image alt="" src="../../../assets/tutorials/1.png" />

2. **Choose the Agent Type**  
   Select **Survey Agent** when prompted. This is a template optimized for gathering structured information—ideal for pre-visit inquiries, intake forms, and other data-collection scenarios.

3. **Name Your Agent & Welcome Message**  
   - Give it a descriptive name (e.g., “Little Brown Fox Physio Intake”).  
   - Add a quick **Welcome Message** that users see right away, e.g., “Welcome to Little Brown Fox Physio! Please answer a few quick questions to help us prepare for your visit.”

4. **Optional Terms & Conditions**  
   - You can include any relevant legal disclaimers or GDPR-related text in the Terms and Conditions field.  
   - If you enable the checkbox, the user must explicitly confirm they agree before proceeding.

---

### **2. Crafting the Agent’s Prompt**

OpenAgentsBuilder uses AI to guide the conversation. Your prompt is the core instruction set for how the agent interacts with the user. For instance, you might say:

> *“You are a physiotherapy assistant helping users prepare for their visit. Please ask no more than five questions about their goals, current issues, health concerns, etc. Gather enough detail for a comprehensive pre-visit report.”*

By setting these boundaries, the AI knows what to ask (e.g., main goal, problem areas, health issues) and can dynamically go deeper based on user responses.

<Image alt="" src="../../../assets/tutorials/2.png" />

---

### **3. Defining Tools and Events**

One of OpenAgentsBuilder’s key strengths is its extensibility—allowing you to add “Tools” or “Events” that let your agent do more than just chat.

- **Tools**  
  For instance, you can enable:  
  - **Access Events Calendar**: Allows the agent to check and display available appointment slots.  
  - **Schedule Events**: Lets the agent schedule an appointment for a user once they confirm a date and time.  
  - **Send Emails**: Triggers an email to you or your team if something urgent arises (e.g., user mentions severe pain).

<Image alt="" src="../../../assets/tutorials/4.png" />


- **Events**  
  Events are automated actions your agent takes under specific conditions. For example:  
  - *If the user mentions “urgent” or “severe pain,” automatically trigger an email notification to the care team.*  

<Image alt="" src="../../../assets/tutorials/3.png" />

---

### **4. Testing Your Agent**

Every new agent gets its own unique URL. Once you’ve set up your agent:

1. **Click Preview** to open a live chat window in your browser.  
2. **Interact with Your Agent**: Test out how it asks questions, records answers, and even schedules an appointment if prompted.  
3. **Review the Data**: Go to the admin panel to see user sessions, conversation transcripts, and any scheduled events or email triggers.

<Image alt="" src="../../../assets/tutorials/5.png" />

---

### **5. Viewing Results and Next Steps**

In the admin panel, you’ll find a **Results** section that compiles user responses into either a JSON object (for easy integration into your CRM or database) or a markdown-based report (ideal for quick sharing with your team). These detailed summaries help your staff prepare thoroughly before the patient or client arrives.

<Image alt="" src="../../../assets/tutorials/6.png" />


---

### **Why OpenAgentsBuilder?**

- **Efficiency**: Automate repetitive tasks and data entry.  
- **User Experience**: Provide an interactive, conversational intake process rather than static forms.  
- **Flexibility**: Easily add or remove AI tools, create triggers, and customize prompts for your unique workflow.  
- **Scalability**: From a single intake form to multiple workflows, you can expand and adapt without reinventing the wheel each time.

---

## **Ready to Build Your Own Agent?**

Whether you’re looking to enhance pre-visit inquiries for a physiotherapy clinic, a consulting service, or any other professional setting, **OpenAgentsBuilder** has you covered. Head over to **[openenginebuilder.com](http://openenginebuilder.com/)** to get your free demo and start creating your own intelligent intake agents today.
