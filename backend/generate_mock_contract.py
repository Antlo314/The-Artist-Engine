import random

with open(r'c:\Users\aarons\Desktop\mock_predatory_contract_30_pages.txt', 'w') as f:
    f.write('EXCLUSIVE RECORDING & ADVANCE AGREEMENT\n\n')
    f.write('This Agreement is made by and between OMEGA RECORDS LLC ("Company") and THE ARTIST ("Artist").\n\n')
    
    boiler_plate = [
        'The Artist agrees to perform their duties in a timely manner. ',
        'Company reserves the right to market the Artist globally. ',
        'Artist shall remain exclusive to the Company for the Term. ',
        'The Term shall encompass the initial period and any exercised options. ',
        'Artist will deliver Masters that are technically and commercially satisfactory. ',
        'Company will provide accounting statements semi-annually within 90 days of the period close. ',
        'Any delay in delivery will suspend the Term indefinitely. '
    ]
    
    f.write('SECTION 1: STANDARD OBLIGATIONS\n')
    for page in range(1, 26):
        f.write(f'\n--- PAGE {page} ---\n')
        # Generate roughly enough text to fill a standard page
        for _ in range(80):
            f.write(random.choice(boiler_plate))
        f.write('\n\n')
        
    f.write('\n\nSECTION 2: ANCILLARY RIGHTS & RECOUPMENT\n')
    f.write('\n--- PAGE 26 ---\n')
    f.write('2.1 ALL-IN RECOUPMENT. The Artist agrees that an advance of $500,000 shall be recouped from 100% of all Artist income streams, including live performances, merchandise, and publishing, until the balance demonstrates a 2x multiple return to the Company.\n\n')
    
    f.write('\n--- PAGE 27 ---\n')
    f.write('2.2 CROSS-COLLATERALIZATION. Deficits from any prior or subsequent agreements between the Artist and the Company, including but not limited to unrecouped touring support or independent video production costs, shall be fully cross-collateralized against all royalties earned hereunder.\n\n')
    
    f.write('\n--- PAGE 28 ---\n')
    f.write('2.3 TERMINATION IN PERPETUITY. The Company retains the unilateral right to terminate this agreement at any time, for any reason, without notice. Upon termination, the Company shall retain 100% of the copyright ownership of all Masters created during the Term, in perpetuity throughout the universe.\n\n')
    
    f.write('\n--- PAGE 29 ---\n')
    f.write('2.4 NAME AND LIKENESS TRANSFER. By signing this agreement, the Artist irrevocably assigns all trademark and intellectual property rights concerning the Artist\'s stage name, likeness, and biometric data to the Company for the duration of the Artist\'s natural life plus 70 years.\n\n')
    
    f.write('\n--- PAGE 30 ---\n')
    f.write('2.5 AUDIT RESTRICTIONS. The Artist waives the right to audit the Company\'s financial records more than once every ten (10) years. Any objection to accounting statements must be made within 30 days of receipt, or they shall be deemed fully accepted and incontestable.\n\n')
    
    # Fill the rest of the 30th page with boiler plate again
    for _ in range(50):
        f.write(random.choice(boiler_plate))
    
    f.write('\n\n[SIGNATURE PAGE FOLLOWS]\n')

print("Mock 30-Page Predatory Contract successfully generated on your Desktop!")
