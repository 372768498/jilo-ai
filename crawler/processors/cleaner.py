def clean_tool_data(tool):
    """清洗工具数据"""
    cleaned = {}
    
    # 清洗文本
    for key in ['name_en', 'tagline_en', 'description_en']:
        if key in tool:
            text = tool[key].strip()
            text = ' '.join(text.split())  # 移除多余空格
            cleaned[key] = text[:500] if key == 'tagline_en' else text[:300]
    
    # 清洗 URL
    if 'official_url' in tool:
        url = tool['official_url'].strip()
        if not url.startswith('http'):
            url = 'https://' + url
        cleaned['official_url'] = url
    
    # 其他字段
    cleaned['pricing_type'] = tool.get('pricing_type', 'freemium')
    cleaned['source'] = tool.get('source', 'manual')
    
    return cleaned