"""
Medical Bill Negotiation Toolkit - PDF Generator
Creates 7 professional PDF guides for medical bill negotiation
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from datetime import datetime

# ============================================
# SHARED STYLES AND COMPONENTS
# ============================================

def create_styles():
    """Create consistent styles for all documents"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a5490'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    # Heading styles
    styles.add(ParagraphStyle(
        name='CustomHeading1',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1a5490'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2c5f8d'),
        spaceAfter=10,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        leading=16,
        alignment=TA_JUSTIFY,
        spaceAfter=10
    ))
    
    # Bullet points
    styles.add(ParagraphStyle(
        name='CustomBullet',
        parent=styles['BodyText'],
        fontSize=11,
        leading=16,
        leftIndent=20,
        spaceAfter=6
    ))
    
    # Important notes (green box)
    styles.add(ParagraphStyle(
        name='SuccessBox',
        parent=styles['BodyText'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#155724'),
        backColor=colors.HexColor('#d4edda'),
        borderColor=colors.HexColor('#c3e6cb'),
        borderWidth=1,
        borderPadding=10,
        spaceAfter=12
    ))
    
    # Warning notes (yellow box)
    styles.add(ParagraphStyle(
        name='WarningBox',
        parent=styles['BodyText'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#856404'),
        backColor=colors.HexColor('#fff3cd'),
        borderColor=colors.HexColor('#ffeaa7'),
        borderWidth=1,
        borderPadding=10,
        spaceAfter=12
    ))
    
    # Danger notes (red box)
    styles.add(ParagraphStyle(
        name='DangerBox',
        parent=styles['BodyText'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#721c24'),
        backColor=colors.HexColor('#f8d7da'),
        borderColor=colors.HexColor('#f5c6cb'),
        borderWidth=1,
        borderPadding=10,
        spaceAfter=12
    ))
    
    return styles

def add_disclaimer_footer(canvas, doc):
    """Add disclaimer to every page footer"""
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.grey)
    
    # Disclaimer text
    disclaimer = "DISCLAIMER: Educational information only. Not legal, financial, or medical advice. Consult professionals for your situation."
    canvas.drawCentredString(letter[0]/2, 0.5*inch, disclaimer)
    
    # Page number
    page_num = f"Page {doc.page}"
    canvas.drawRightString(letter[0] - 0.5*inch, 0.5*inch, page_num)
    
    canvas.restoreState()

def create_cover_page(styles):
    """Create cover page elements"""
    story = []
    
    story.append(Spacer(1, 2*inch))
    
    title = Paragraph("Medical Bill Negotiation<br/>Complete Toolkit", styles['CustomTitle'])
    story.append(title)
    
    story.append(Spacer(1, 0.5*inch))
    
    subtitle = Paragraph(
        "<b>Save Thousands on Your Medical Bills</b><br/>"
        "A Step-by-Step Guide to Successful Negotiation",
        ParagraphStyle(
            'Subtitle',
            parent=styles['CustomBody'],
            fontSize=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2c5f8d')
        )
    )
    story.append(subtitle)
    
    story.append(Spacer(1, 1*inch))
    
    stats = Paragraph(
        "✓ Average savings: 40-60% off original bill<br/>"
        "✓ Success rate: 30-50% of bills negotiable<br/>"
        "✓ Used by thousands of Americans<br/>"
        "✓ No special skills required",
        ParagraphStyle(
            'Stats',
            parent=styles['CustomBody'],
            fontSize=12,
            alignment=TA_CENTER,
            leading=20
        )
    )
    story.append(stats)
    
    story.append(PageBreak())
    
    return story

# ============================================
# DOCUMENT 1: START HERE GUIDE
# ============================================

def create_start_here_pdf():
    """Create the welcome and navigation guide"""
    filename = "01_START_HERE.pdf"
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=1*inch
    )
    
    styles = create_styles()
    story = []
    
    # Cover page
    story.extend(create_cover_page(styles))
    
    # Welcome section
    story.append(Paragraph("Welcome to Your Medical Bill Negotiation Toolkit", styles['CustomHeading1']))
    
    story.append(Paragraph(
        "Medical bills in the United States are notoriously inflated and confusing. But here's what "
        "hospitals don't advertise: <b>Almost everything is negotiable.</b>",
        styles['CustomBody']
    ))
    
    story.append(Paragraph(
        "This toolkit will teach you proven strategies to reduce your medical bills by 40-60% or more. "
        "The techniques inside are used by professional medical bill advocates and have helped thousands "
        "of Americans save money.",
        styles['CustomBody']
    ))
    
    story.append(Spacer(1, 0.3*inch))
    
    # What's included
    story.append(Paragraph("📦 What's Included in This Toolkit", styles['CustomHeading1']))
    
    modules = [
        ("Module 1: Complete Framework", "Learn WHY and HOW medical bill negotiation works"),
        ("Module 2: Letter Templates", "6 ready-to-use negotiation letters for different scenarios"),
        ("Module 3: Phone Scripts", "Word-for-word scripts for phone negotiations"),
        ("Module 4: Price Analysis", "How to research fair prices and spot overcharges"),
        ("Module 5: Case Studies", "Real examples of successful negotiations"),
        ("Module 6: Quick Reference", "One-page cheat sheet you can print and use"),
    ]
    
    for module, description in modules:
        story.append(Paragraph(f"<b>{module}</b>", styles['CustomBullet']))
        story.append(Paragraph(description, styles['CustomBody']))
        story.append(Spacer(1, 0.1*inch))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Recommended order
    story.append(Paragraph("🎯 Recommended Reading Order", styles['CustomHeading1']))
    
    story.append(Paragraph(
        "<b>If you're new to medical bill negotiation:</b>",
        styles['CustomHeading2']
    ))
    
    order = [
        "Start with Module 1 to understand the complete framework",
        "Review Module 4 to analyze your specific bill",
        "Choose templates from Module 2 OR scripts from Module 3",
        "Read Module 5 for real-world confidence",
        "Print Module 6 as your quick reference"
    ]
    
    for i, step in enumerate(order, 1):
        story.append(Paragraph(f"{i}. {step}", styles['CustomBullet']))
    
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "<b>If you're ready to negotiate now:</b>",
        styles['CustomHeading2']
    ))
    
    story.append(Paragraph(
        "Jump straight to Module 2 (letters) or Module 3 (phone scripts), then refer back to "
        "other modules as needed.",
        styles['CustomBody']
    ))
    
    story.append(PageBreak())
    
    # Setting expectations
    story.append(Paragraph("💡 Setting Realistic Expectations", styles['CustomHeading1']))
    
    story.append(Paragraph(
        "<b>Success Rates:</b>",
        styles['CustomHeading2']
    ))
    
    story.append(Paragraph(
        "• 30-50% of medical bills contain errors or are negotiable<br/>"
        "• Average reduction: 40-60% when successful<br/>"
        "• Some bills may not be negotiable (e.g., already discounted, small amounts)<br/>"
        "• First attempt may fail - persistence is key",
        styles['CustomBody']
    ))
    
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "<b>Time Investment:</b>",
        styles['CustomHeading2']
    ))
    
    story.append(Paragraph(
        "• Initial preparation: 1-2 hours<br/>"
        "• Per negotiation: 30 minutes to 2 hours<br/>"
        "• Follow-up: 15-30 minutes per contact<br/>"
        "• Total process: 1-4 weeks typically",
        styles['CustomBody']
    ))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Important legal disclaimer
    story.append(Paragraph(
        "⚖️ IMPORTANT LEGAL DISCLAIMER",
        ParagraphStyle(
            'DisclaimerTitle',
            parent=styles['CustomHeading1'],
            textColor=colors.red
        )
    ))
    
    story.append(Paragraph(
        "This toolkit provides educational information about medical bill negotiation strategies. "
        "It is NOT legal advice, financial advice, or medical advice. The information provided is "
        "based on common practices and publicly available information.",
        styles['DangerBox']
    ))
    
    story.append(Paragraph(
        "<b>You should consult with appropriate professionals:</b><br/>"
        "• A licensed attorney for legal questions<br/>"
        "• A certified financial advisor for financial planning<br/>"
        "• Your healthcare provider for medical questions<br/>"
        "• A patient advocate if your situation is complex",
        styles['CustomBody']
    ))
    
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "The strategies in this toolkit are legal and widely used, but results vary by situation, "
        "provider, and location. No guarantee of specific outcomes is made or implied.",
        styles['CustomBody']
    ))
    
    story.append(PageBreak())
    
    # Quick start checklist
    story.append(Paragraph("✅ Quick Start Checklist", styles['CustomHeading1']))
    
    story.append(Paragraph(
        "Before you start negotiating, gather these items:",
        styles['CustomBody']
    ))
    
    checklist = [
        "□ All medical bills (including itemized bills if available)",
        "□ Explanation of Benefits (EOB) from insurance (if applicable)",
        "□ Payment records (if you've paid anything)",
        "□ Notes about your financial situation",
        "□ Calendar for tracking follow-ups",
        "□ Notebook for recording conversations",
        "□ This toolkit!"
    ]
    
    for item in checklist:
        story.append(Paragraph(item, styles['CustomBullet']))
    
    story.append(Spacer(1, 0.3*inch))
    
    # When not to negotiate
    story.append(Paragraph("🛑 When NOT to Use This Toolkit", styles['CustomHeading1']))
    
    story.append(Paragraph(
        "This toolkit may not be appropriate if:",
        styles['CustomBody']
    ))
    
    when_not = [
        "Your bill is already very small (under $500) - time cost may exceed savings",
        "You're involved in active litigation about the bill",
        "The provider has already filed a lawsuit against you",
        "You're facing immediate collections action",
        "You have access to a professional patient advocate (use them instead!)",
    ]
    
    for item in when_not:
        story.append(Paragraph(f"• {item}", styles['CustomBullet']))
    
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "In these cases, consult a professional immediately.",
        styles['WarningBox']
    ))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Ready to begin
    story.append(Paragraph("🚀 Ready to Begin?", styles['CustomHeading1']))
    
    story.append(Paragraph(
        "You've taken the first step toward taking control of your medical bills. Remember:",
        styles['CustomBody']
    ))
    
    story.append(Paragraph(
        "<b>• You have the right to negotiate</b> - Healthcare providers negotiate with insurance "
        "companies every day. You're simply doing the same thing.<br/><br/>"
        "<b>• Hospitals expect this</b> - Financial assistance and negotiation departments exist "
        "specifically for this purpose.<br/><br/>"
        "<b>• Politeness pays</b> - Be firm but respectful. The person on the phone is just doing their job.<br/><br/>"
        "<b>• Persistence wins</b> - Don't give up after the first 'no'. Many successful negotiations "
        "happen on the second or third attempt.",
        styles['CustomBody']
    ))
    
    story.append(Spacer(1, 0.3*inch))
    
    story.append(Paragraph(
        "<b>Turn to Module 1 to understand the complete framework, or jump to Module 2 or 3 if you're "
        "ready to start negotiating now.</b>",
        styles['SuccessBox']
    ))
    
    # Build PDF
    doc.build(story, onFirstPage=add_disclaimer_footer, onLaterPages=add_disclaimer_footer)
    print(f"✅ Created: {filename}")

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    print("🏥 Medical Bill Negotiation Toolkit Generator")
    print("=" * 50)
    print("\nGenerating PDF documents...\n")
    
    try:
        create_start_here_pdf()
        print("\n✅ Document 1 of 7 complete!")
        print("\nNext: Creating remaining modules...")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
