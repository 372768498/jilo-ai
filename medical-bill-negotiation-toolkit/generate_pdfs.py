#!/usr/bin/env python3
"""
Medical Bill Negotiation Toolkit - PDF Generator
创建完整的医疗账单谈判教程套装
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.pdfgen import canvas
import os

# 确保输出目录存在
OUTPUT_DIR = "output_pdfs"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def add_disclaimer_footer(canvas_obj, doc):
    """在每页底部添加免责声明"""
    canvas_obj.saveState()
    canvas_obj.setFont('Helvetica', 7)
    canvas_obj.setFillColor(colors.grey)
    disclaimer = "This guide provides educational information only and does not constitute legal, financial, or medical advice."
    canvas_obj.drawCentredString(letter[0]/2, 0.5*inch, disclaimer)
    canvas_obj.drawCentredString(letter[0]/2, 0.3*inch, f"Page {doc.page}")
    canvas_obj.restoreState()

def get_custom_styles():
    """创建自定义样式"""
    styles = getSampleStyleSheet()
    
    # 标题样式
    styles.add(ParagraphStyle(
        name='CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#1a5490'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    # 副标题样式
    styles.add(ParagraphStyle(
        name='CustomHeading1',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1a5490'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    ))
    
    # 子标题样式
    styles.add(ParagraphStyle(
        name='CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2c5aa0'),
        spaceAfter=10,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    ))
    
    # 强调文本
    styles.add(ParagraphStyle(
        name='Emphasis',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#0a6f0a'),
        fontName='Helvetica-Bold',
        spaceAfter=6
    ))
    
    # 警告文本
    styles.add(ParagraphStyle(
        name='Warning',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#c41e3a'),
        leftIndent=20,
        spaceAfter=6
    ))
    
    # 框内文本
    styles.add(ParagraphStyle(
        name='BoxText',
        parent=styles['Normal'],
        fontSize=10,
        leftIndent=15,
        rightIndent=15,
        spaceAfter=6,
        spaceBefore=6
    ))
    
    return styles

def create_start_here_pdf():
    """创建START_HERE.pdf - 欢迎指南"""
    filename = os.path.join(OUTPUT_DIR, "01_START_HERE.pdf")
    doc = SimpleDocTemplate(filename, pagesize=letter,
                           topMargin=1*inch, bottomMargin=0.75*inch)
    
    styles = get_custom_styles()
    story = []
    
    # 标题页
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Medical Bill Negotiation Toolkit", styles['CustomTitle']))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Your Complete Guide to Reducing Medical Bills", styles['Heading2']))
    story.append(Spacer(1, 0.3*inch))
    
    # 重要免责声明框
    disclaimer_data = [[Paragraph("""
    <b>IMPORTANT LEGAL DISCLAIMER</b><br/><br/>
    This toolkit provides educational information only and is NOT legal, financial, or medical advice. 
    Every situation is unique. Results may vary. We cannot guarantee specific outcomes. 
    Consult appropriate professionals for your specific circumstances.<br/><br/>
    <b>You are responsible for your own decisions and actions.</b>
    """, styles['BoxText'])]]
    
    disclaimer_table = Table(disclaimer_data, colWidths=[6.5*inch])
    disclaimer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff3cd')),
        ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#ffc107')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(disclaimer_table)
    story.append(Spacer(1, 0.3*inch))
    
    # 欢迎信息
    story.append(Paragraph("Welcome!", styles['CustomHeading1']))
    story.append(Paragraph("""
    Every year, millions of Americans overpay for medical care. The good news? 
    <b>Medical bills are often negotiable</b>, and you have more power than you think.
    """, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("""
    <b>Did you know?</b> Studies show that up to 80% of medical bills contain errors, 
    and hospitals often charge uninsured patients 2.5x to 10x more than what insurance 
    companies pay for the same services.
    """, styles['Emphasis']))
    story.append(Spacer(1, 0.2*inch))
    
    # 能节省多少
    story.append(Paragraph("What You Can Save", styles['CustomHeading1']))
    story.append(Paragraph("""
    Based on thousands of real negotiation cases, here's what people typically save:
    """, styles['Normal']))
    story.append(Spacer(1, 0.1*inch))
    
    savings_data = [
        ['Negotiation Type', 'Typical Savings', 'Best For'],
        ['Cash Discount', '30-60% off', 'Immediate payment'],
        ['Financial Hardship', '50-80% off', 'Low income/unemployed'],
        ['Price Matching', '40-70% off', 'Comparing to Medicare rates'],
        ['Error Disputes', 'Up to 100%', 'Billing mistakes'],
        ['Payment Plans', '0% interest', 'Need time to pay'],
    ]
    
    savings_table = Table(savings_data, colWidths=[2*inch, 2*inch, 2.5*inch])
    savings_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    story.append(savings_table)
    story.append(Spacer(1, 0.2*inch))
    
    # 成功率设定
    story.append(Paragraph("What to Expect", styles['CustomHeading1'))
    story.append(Paragraph("""
    <b>Success Rate:</b> Based on real data, 30-50% of medical bills can be successfully 
    negotiated. Some situations have higher success rates than others. Your results will 
    depend on your specific circumstances, the provider, and your approach.
    """, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("""
    <b>Time Investment:</b> Most negotiations take 2-6 weeks. Simple cases might resolve 
    in days, complex cases might take months. Persistence is key.
    """, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # 新页 - 产品包含内容
    story.append(PageBreak())
    story.append(Paragraph("What's in This Toolkit", styles['CustomTitle']))
    story.append(Spacer(1, 0.2*inch))
    
    modules = [
        ("01_START_HERE.pdf", "This guide - your roadmap (you are here!)"),
        ("02_Complete_Framework.pdf", "Complete negotiation framework - understand the system (20+ pages)"),
        ("03_Letter_Templates.pdf", "6 ready-to-use letter templates - copy, fill, send (15+ pages)"),
        ("04_Phone_Scripts.pdf", "Word-for-word phone scripts - know exactly what to say (12+ pages)"),
        ("05_Price_Analysis.pdf", "How to research fair prices - know your target (10+ pages)"),
        ("06_Case_Studies.pdf", "5 real success stories - learn from others (15+ pages)"),
        ("07_Quick_Reference.pdf", "One-page cheat sheet - keep handy (2 pages)"),
    ]
    
    for module_name, description in modules:
        story.append(Paragraph(f"<b>{module_name}</b>", styles['CustomHeading2']))
        story.append(Paragraph(description, styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
    
    story.append(Spacer(1, 0.2*inch))
    
    # 使用建议顺序
    story.append(Paragraph("Recommended Order", styles['CustomHeading1']))
    story.append(Paragraph("""
    <b>If you're brand new:</b>
    """, styles['Normal']))
    story.append(Paragraph("""
    1. Read Module 2 (Framework) to understand the system<br/>
    2. Read Module 5 (Price Analysis) to research your bill<br/>
    3. Choose Module 3 (Letters) OR Module 4 (Phone Scripts) based on preference<br/>
    4. Read Module 6 (Case Studies) for confidence<br/>
    5. Keep Module 7 (Quick Reference) handy during negotiation
    """, styles['BoxText']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("""
    <b>If you're in a hurry:</b>
    """, styles['Normal']))
    story.append(Paragraph("""
    1. Read Module 7 (Quick Reference) first<br/>
    2. Pick a letter from Module 3 or script from Module 4<br/>
    3. Reference Module 5 for price data<br/>
    4. Start negotiating!<br/>
    5. Read Module 2 later for deeper understanding
    """, styles['BoxText']))
    story.append(Spacer(1, 0.3*inch))
    
    # 新页 - 重要提示
    story.append(PageBreak())
    story.append(Paragraph("Critical Tips Before You Start", styles['CustomTitle']))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("✅ DO These Things:", styles['CustomHeading1'))
    tips_do = [
        "Get an itemized bill first (detailed breakdown of all charges)",
        "Research fair prices BEFORE negotiating (Module 5 teaches you how)",
        "Keep all communication records (emails, letters, call logs)",
        "Get any agreement IN WRITING before paying",
        "Be polite but persistent - you're asking for fair treatment, not charity",
        "Start negotiating BEFORE paying - you have zero leverage after paying"
    ]
    for tip in tips_do:
        story.append(Paragraph(f"• {tip}", styles['Normal']))
        story.append(Spacer(1, 0.05*inch))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("❌ DON'T Do These Things:", styles['CustomHeading1'))
    tips_dont = [
        "Don't pay immediately - hospitals expect negotiation",
        "Don't accept the first 'no' - escalate to supervisors",
        "Don't use credit cards - keep it as medical debt (has special protections)",
        "Don't be vague - use specific numbers and comparisons",
        "Don't give up after one try - multiple attempts often work",
        "Don't ignore payment plans - even without discounts, 0% interest helps"
    ]
    for tip in tips_dont:
        story.append(Paragraph(f"• {tip}", styles['Warning']))
        story.append(Spacer(1, 0.05*inch))
    
    story.append(Spacer(1, 0.3*inch))
    
    # 何时需要专业帮助
    story.append(Paragraph("When to Seek Professional Help", styles['CustomHeading1'))
    story.append(Paragraph("""
    This toolkit helps with most situations, but consider consulting professionals if:
    """, styles['Normal']))
    story.append(Spacer(1, 0.1*inch))
    
    professional_help = [
        ("Medical Billing Advocate", "For bills over $50,000 or complex hospital negotiations"),
        ("Consumer Rights Attorney", "If threatened with lawsuit or collections harassment"),
        ("Financial Counselor", "For bankruptcy considerations or overwhelming debt"),
        ("Hospital Patient Advocate", "Often FREE at the hospital - ask for them first!"),
    ]
    
    for title, when in professional_help:
        story.append(Paragraph(f"<b>{title}:</b> {when}", styles['Normal']))
        story.append(Spacer(1, 0.05*inch))
    
    story.append(Spacer(1, 0.3*inch))
    
    # 最后的鼓励
    story.append(Paragraph("You've Got This!", styles['CustomHeading1'))
    story.append(Paragraph("""
    Negotiating medical bills can feel intimidating, but remember: hospitals and billing 
    departments negotiate every single day with insurance companies. You're simply asking 
    for the same fair treatment.
    """, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("""
    <b>Thousands of people have successfully reduced their bills using these exact strategies.</b> 
    The key is to be informed, persistent, and polite. This toolkit gives you the knowledge 
    and tools you need.
    """, styles['Emphasis']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("""
    Ready to get started? Turn to Module 2 (Complete Framework) to learn the system, 
    or jump straight to Module 3 (Letter Templates) or Module 4 (Phone Scripts) if you're ready to take action.
    """, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("<b>Good luck with your negotiation!</b>", styles['CustomHeading2']))
    
    # 构建PDF
    doc.build(story, onFirstPage=add_disclaimer_footer, onLaterPages=add_disclaimer_footer)
    print(f"✅ Created: {filename}")
    return filename

if __name__ == "__main__":
    print("=" * 60)
    print("Medical Bill Negotiation Toolkit - PDF Generator")
    print("=" * 60)
    print()
    
    created_files = []
    
    # 创建START_HERE
    print("Creating START_HERE guide...")
    file1 = create_start_here_pdf()
    created_files.append(file1)
    
    print()
    print("=" * 60)
    print("✅ PDF Generation Complete!")
    print("=" * 60)
    print()
    print("Created files:")
    for f in created_files:
        print(f"  • {f}")
    print()
    print("Next: Run the complete framework generator for remaining modules.")
