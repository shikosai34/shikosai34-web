import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

// 画面が割れるようなクリッピンググリッチエフェクト
const GlitchText = ({ text }: { text: string }) => {
  return (
    <div className="relative inline-block">
      <span className="relative z-10">{text}</span>
      
      {/* Glitch Layer 1 (Accent) */}
      <motion.span
        className="absolute top-0 left-0 -ml-1 text-transparent mix-blend-screen opacity-70 pointer-events-none"
        style={{ WebkitTextStroke: '2px var(--color-accent)' }}
        animate={{
          x: [-2, 4, -3, 2, 0, -2, 3, 0],
          y: [1, -2, 2, -1, 0, 1, -1, 0],
          clipPath: [
            'inset(20% 0 80% 0)',
            'inset(10% 0 40% 0)',
            'inset(80% 0 5% 0)',
            'inset(40% 0 50% 0)',
            'inset(0% 0 100% 0)'
          ],
        }}
        transition={{ duration: 0.4, repeat: Infinity, repeatType: "mirror", repeatDelay: Math.random() * 3 + 1 }}
      >
        {text}
      </motion.span>
      
      {/* Glitch Layer 2 (Main) */}
      <motion.span
        className="absolute top-0 left-0 ml-1 text-transparent mix-blend-screen opacity-70 pointer-events-none"
        style={{ WebkitTextStroke: '2px var(--color-main)' }}
        animate={{
          x: [2, -3, 3, -2, 0, 4, -2, 0],
          y: [-1, 2, -2, 1, 0, -1, 1, 0],
          clipPath: [
            'inset(80% 0 10% 0)',
            'inset(30% 0 60% 0)',
            'inset(10% 0 80% 0)',
            'inset(60% 0 20% 0)',
            'inset(0% 0 100% 0)'
          ],
        }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror", repeatDelay: Math.random() * 3 + 1.5 }}
      >
        {text}
      </motion.span>
    </div>
  );
};

// 背後を落ちるデータストリーム（マトリックス風のサイバーパンク要素）
const DataStream = ({ delay, left }: { delay: number, left: number }) => {
  return (
    <motion.div
      className="absolute top-[-20%] w-1 md:w-2 opacity-40 pointer-events-none"
      style={{ 
        left: `${left}%`, 
        backgroundColor: 'var(--color-accent)',
        height: Math.random() * 150 + 50 + 'px',
        filter: 'blur(3px)',
        boxShadow: '0 0 10px var(--color-accent)'
      }}
      animate={{ y: ['-20vh', '120vh'] }}
      transition={{ duration: Math.random() * 2 + 2, repeat: Infinity, delay, ease: 'linear' }}
    />
  );
};

export default function AnimatedNotFound() {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // マウス追従のパララックス（視差）エフェクト用設定
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 100 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  
  // マウス位置に応じた背景と前景の回転・移動量
  const bgRotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const bgRotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const bgTranslateX = useTransform(springX, [-0.5, 0.5], [-20, 20]);
  const bgTranslateY = useTransform(springY, [-0.5, 0.5], [-20, 20]);
  
  const fgTranslateX = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const fgTranslateY = useTransform(springY, [-0.5, 0.5], [-10, 10]);

  useEffect(() => {
    setIsMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) - 0.5;
      const y = (e.clientY / innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  if (!isMounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--color-base)' }}>
        <span style={{ color: 'var(--color-accent)' }} className="text-xl font-bold font-mono animate-pulse">
          INITIALIZING_SYSTEM_UI...
        </span>
      </div>
    );
  }

  const streams = Array.from({ length: 20 }).map((_, i) => (
    <DataStream key={i} left={Math.random() * 100} delay={Math.random() * 5} />
  ));

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden z-50"
      style={{ 
        backgroundColor: 'var(--color-base)',
        perspective: '1000px' // 3Dパララックス用の視点距離
      }}
    >
      {/* --- 3D背景レイヤー（マウスに追従して大きく動く） --- */}
      <motion.div 
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
        style={{ 
          rotateX: bgRotateX, 
          rotateY: bgRotateY, 
          x: bgTranslateX, 
          y: bgTranslateY, 
          transformStyle: "preserve-3d" 
        }}
      >
        {/* 動くサイバーパンクグリッド */}
        <motion.div 
          className="absolute w-[150%] h-[150%] opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(90deg, transparent 95%, var(--color-accent) 95%),
              linear-gradient(transparent 95%, var(--color-accent) 95%)
            `,
            backgroundSize: '40px 40px',
            translateZ: -100, // 奥に配置
          }}
          animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* 奥を流れるデータストリーム */}
        <div className="absolute inset-0" style={{ transform: 'translateZ(-50px)' }}>
          {streams}
        </div>
        
        {/* 背景に浮かぶ巨大な404透かし */}
        <div 
          className="absolute font-black tracking-widest text-[20rem] md:text-[30rem] opacity-[0.03] pointer-events-none select-none font-mono"
          style={{ color: 'var(--color-main)', transform: 'translateZ(-150px)' }}
        >
          404
        </div>
      </motion.div>

      {/* --- 前面スクリーン・オーバーレイレイヤー（固定・画面エフェクト） --- */}
      <div className="absolute inset-0 pointer-events-none z-10">
        
        {/* 動くスキャンライン（走査線） */}
        <motion.div 
          className="absolute inset-0 opacity-10"
          style={{
            background: 'linear-gradient(to bottom, transparent 50%, #000 51%)',
            backgroundSize: '100% 4px',
          }}
          animate={{ y: [0, 4] }}
          transition={{ duration: 0.1, repeat: Infinity, ease: 'linear' }}
        />

        {/* 画面全体の微小なフリッカー（チラつき）エフェクト */}
        <motion.div
          className="absolute inset-0 mix-blend-overlay"
          style={{ backgroundColor: 'var(--color-accent)' }}
          animate={{ opacity: [0, 0.05, 0, 0.08, 0, 0.02, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', times: [0, 0.1, 0.2, 0.8, 0.85, 0.9, 1] }}
        />

        {/* 縦のカラーバーの伸び縮みエフェクト */}
        <div className="absolute left-2 md:left-8 top-0 bottom-0 w-1 md:w-2 flex flex-col opacity-60">
          <motion.div 
            className="w-full" 
            style={{ backgroundColor: 'var(--color-main)' }} 
            animate={{ height: ['25%', '35%', '25%'] }} 
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} 
          />
          <motion.div className="w-full flex-1" style={{ backgroundColor: 'var(--color-accent)' }} />
        </div>

        {/* 警告テープ */}
        <div className="absolute top-0 right-0 left-0 h-1 md:h-2 opacity-80" 
             style={{ background: `repeating-linear-gradient(45deg, var(--color-main), var(--color-main) 10px, transparent 10px, transparent 20px)` }} 
        />
        
        {/* ターミナル風ローディングテキスト（点滅カーソル付き） */}
        <div className="absolute bottom-6 left-6 font-mono text-xs md:text-sm opacity-80 tracking-widest leading-relaxed" style={{ color: 'var(--color-accent)' }}>
          <div>
            <span style={{ color: 'var(--color-main)' }}>root@shikosai:~$</span> fetch /page
          </div>
          <div>ERROR: 404_NOT_FOUND</div>
          <div className="flex">
            <span>RETRYING_CONNECTION...</span>
            <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
              _
            </motion.span>
          </div>
        </div>
        
        {/* サイバーな四隅の角装飾（明滅） */}
        <motion.div 
          className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2" 
          style={{ borderColor: 'var(--color-accent)' }} 
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2" 
          style={{ borderColor: 'var(--color-main)' }} 
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* --- メインコンテンツレイヤー（マウスに追従して小さく逆に動く） --- */}
      <motion.div 
        className="relative z-20 flex flex-col items-center space-y-8 select-none px-4"
        style={{ x: fgTranslateX, y: fgTranslateY }}
      >
        
        {/* タイトル領域 */}
        <motion.div
          className="relative text-center mt-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
        >
          {/* 強烈なバックライト */}
          <div 
            className="absolute -inset-10 opacity-30 blur-3xl pointer-events-none"
            style={{ backgroundColor: 'var(--color-accent)' }}
          />
          
          <h1 
            className="relative text-[7rem] md:text-[13rem] font-black tracking-widest leading-none font-mono"
            style={{ color: 'var(--color-text)', textShadow: `0 0 25px color-mix(in srgb, var(--color-accent) 50%, transparent)` }}
          >
            <GlitchText text="4" />
            <GlitchText text="0" />
            <GlitchText text="4" />
          </h1>
        </motion.div>

        {/* メッセージボックス */}
        <motion.div 
          className="text-center space-y-5 max-w-lg mt-8 relative px-8 py-6 backdrop-blur-md border-l-4 border-r-4 shadow-2xl" 
          style={{ 
            borderColor: 'var(--color-accent)',
            backgroundColor: 'color-mix(in srgb, var(--color-base) 80%, transparent)' 
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 
            className="text-xl md:text-2xl font-bold tracking-widest font-mono flex items-center justify-center gap-3"
            style={{ color: 'var(--color-accent)' }}
          >
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}>
              ⚠️
            </motion.span>
            ERROR: PAGE_NOT_FOUND
          </h2>
          <p 
            className="text-base md:text-lg leading-loose font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            アクセスしたURLは存在しないか、<br />
            データが破損しています。<br />
            安全な接続を確保するため、<br />
            ホームディレクトリへお戻りください。
          </p>
        </motion.div>

        {/* 帰還ボタン */}
        <motion.a
          href="/"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05, textShadow: "0 0 8px rgb(255,255,255)" }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center justify-center gap-4 px-12 py-5 mt-6 overflow-hidden font-bold text-lg tracking-[0.2em] transition-shadow duration-300 pointer-events-auto cursor-pointer"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-base) 90%, transparent)',
            border: `1px solid var(--color-accent)`,
            color: 'var(--color-text)',
            boxShadow: `0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent), inset 0 0 10px color-mix(in srgb, var(--color-accent) 20%, transparent)`
          }}
        >
          {/* ホバー時のグリッチ背景 */}
          <motion.div 
            className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-30 transition-opacity duration-300" 
            style={{ backgroundColor: 'var(--color-accent)' }}
            animate={{ x: [-5, 5, -5] }}
            transition={{ duration: 0.1, repeat: Infinity }}
          />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--color-accent)] font-mono">
            RETURN_TO_HOME
          </span>
          <motion.div 
            className="relative z-10 w-3 h-3" 
            style={{ backgroundColor: 'var(--color-main)' }} 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.a>
      </motion.div>
    </div>
  );
}
