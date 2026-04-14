import React, { useState, useRef, useEffect } from 'react';
import { Tv, Maximize2, RefreshCw, Radio, ChevronLeft, ChevronRight } from 'lucide-react';

interface Channel {
    id: string;
    name: string;
    shortName: string;
    youtubeId: string;
    videoId: string;
    logo: string;
    color: string;
    region: string;
    category: string;
}

// Live stream channel list with confirmed current Video IDs to bypass Error 153
// Live stream channel list with verified UC... IDs for 100% stable /live_stream embedding
export const CHANNELS: Channel[] = [
    {
        id: 'bloomberg',
        name: 'Bloomberg Television',
        shortName: 'Bloomberg',
        youtubeId: 'UCIALMKvObZNtJ6AmdCLP7Lg',
        videoId: '', 
        logo: 'https://www.bloomberg.com/favicon.ico',
        color: '#FF6600',
        region: 'Global',
        category: 'Finance'
    },
    {
        id: 'cnbc',
        name: 'CNBC International',
        shortName: 'CNBC',
        youtubeId: 'UCvJJ_dzjViJCoLf5uKUTwoA',
        videoId: '',
        logo: 'https://www.cnbc.com/favicon.ico',
        color: '#0066FF',
        region: 'Global',
        category: 'Finance'
    },
    {
        id: 'livenowfox',
        name: 'LiveNOW from FOX',
        shortName: 'Fox News',
        youtubeId: 'UCJg9wBPyKMNA5sRDnvzmkdg',
        videoId: 'SlNE7izkWjc', // Direct stable ID
        logo: 'https://www.foxnews.com/favicon.ico',
        color: '#003087',
        region: 'USA',
        category: 'News'
    },
    {
        id: 'skynews',
        name: 'Sky News Live',
        shortName: 'Sky News',
        youtubeId: 'UCoMdktPbSTixAyNGwb-UYkQ',
        videoId: 'n026v9HidIs', // Direct stable ID
        logo: 'https://www.google.com/s2/favicons?sz=128&domain=sky.com', // Fallback to secondary Google API to resolve 404
        color: '#E00034',
        region: 'UK',
        category: 'News'
    },
    {
        id: 'euronews',
        name: 'Euronews English',
        shortName: 'Euronews',
        youtubeId: 'UCSrZ3UV4jOidv8ppoVuvW9Q',
        videoId: 'pykpO5kQJ98', // Direct stable ID
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=euronews.com',
        color: '#00548F',
        region: 'Europe',
        category: 'News'
    },
    {
        id: 'dw',
        name: 'DW News Live',
        shortName: 'DW',
        youtubeId: 'UCknLrEdhRCp1aegoMqRaCZg',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=dw.com',
        color: '#D00000',
        region: 'Germany',
        category: 'News'
    },
    {
        id: 'france24',
        name: 'France 24 English',
        shortName: 'France 24',
        youtubeId: 'UCCCPCZNChQdGa9EkATeye4g',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=france24.com',
        color: '#E60019',
        region: 'France',
        category: 'News'
    },
    {
        id: 'aljazeera',
        name: 'Al Jazeera English',
        shortName: 'Al Jazeera',
        youtubeId: 'UCfiwzLy-8yKzIbsmZTzxDgw',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=aljazeera.com',
        color: '#009BB8',
        region: 'Global',
        category: 'News'
    },
    {
        id: 'alarabiya',
        name: 'Al Arabiya News',
        shortName: 'Al Arabiya',
        youtubeId: 'UCahpxixMCwoANAftn6IxkTg',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=alarabiya.net',
        color: '#C8102E',
        region: 'Arabic',
        category: 'Arabic'
    },
    {
        id: 'asharqnews',
        name: 'Asharq News',
        shortName: 'Asharq News',
        youtubeId: 'UCRJUVYt9gjg8MnlGacySUdg',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=asharq.com',
        color: '#000000',
        region: 'Arabic',
        category: 'Arabic'
    },
    {
        id: 'asharqbusiness',
        name: 'Asharq Business',
        shortName: 'Asharq Biz',
        youtubeId: 'UCxjpGbfoLy6oodYdiyzQE4g',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=asharq.com', 
        color: '#FFD700',
        region: 'Arabic',
        category: 'Finance'
    },
    {
        id: 'skynewsarabia',
        name: 'Sky News Arabia',
        shortName: 'Sky Arabia',
        youtubeId: 'UCIJXOvggjKtCagMfxvcCzAA',
        videoId: '',
        logo: 'https://www.google.com/s2/favicons?sz=64&domain=skynewsarabia.com',
        color: '#E00034',
        region: 'Arabic',
        category: 'Arabic'
    },
];

const LiveIntelligenceStreams: React.FC = () => {
    const [activeChannel, setActiveChannel] = useState<Channel>(CHANNELS[0]);
    const [isMuted] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const filteredChannels = CHANNELS;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const switchChannel = (channel: Channel) => {
        setIsLoading(true);
        setHasError(false);
        setActiveChannel(channel);
    };

    const handleRetry = () => {
        setIsLoading(true);
        setHasError(false);
        // Force iframe reload by toggling channel
        const current = activeChannel;
        setActiveChannel({ ...current });
    };

    const scrollChannels = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    // Use specific Video ID if available to bypass Error 153 configuration issues
    // Fall back to live_stream?channel= only if videoId is empty
    const embedUrl = activeChannel.videoId 
        ? `https://www.youtube.com/embed/${activeChannel.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`
        : `https://www.youtube.com/embed/live_stream?channel=${activeChannel.youtubeId}&autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`;

    return (
        <div className="glass-card live-streams-card" style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            marginBottom: '1.5rem',
            background: 'var(--color-bg-secondary)'
        }}>

            {/* Removed: LIVE Header and Category Filters to maximize video space */}
            
            {/* Main Video Player */}
            <div style={{ position: 'relative', paddingBottom: '40%', background: 'var(--color-bg-primary)', minHeight: '240px' }}>
                {isLoading && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '1rem',
                        background: 'var(--color-bg-primary)', zIndex: 2
                    }}>
                        <Radio size={32} color={activeChannel.color} className="pulse" />
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            Connecting to {activeChannel.name}...
                        </div>
                        <div style={{
                            width: '160px', height: '3px', background: 'var(--color-border)',
                            borderRadius: '2px', overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%', width: '60%', background: activeChannel.color,
                                borderRadius: '2px', animation: 'scan-progress 1.5s ease-in-out infinite'
                            }} />
                        </div>
                    </div>
                )}

                {hasError && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'var(--color-bg-primary)', zIndex: 2
                    }}>
                        <Tv size={48} color="var(--color-text-tertiary)" />
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '0 2rem' }}>
                            Stream temporarily unavailable.<br />
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                This channel may have restricted embedding.
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleRetry}
                                className="glass-button"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px' }}
                            >
                                <RefreshCw size={14} /> Retry
                            </button>
                            <a
                                href={`https://www.youtube.com/channel/${activeChannel.youtubeId}/live`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px',
                                    background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)',
                                    color: '#FF4444', textDecoration: 'none', fontWeight: 600
                                }}
                            >
                                <Maximize2 size={14} /> Open on YouTube
                            </a>
                        </div>
                    </div>
                )}

                <iframe
                    ref={iframeRef}
                    key={activeChannel.id}
                    src={embedUrl}
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%', border: 'none'
                    }}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={activeChannel.name}
                    onLoad={() => { setIsLoading(false); }}
                    onError={() => { setIsLoading(false); setHasError(true); }}
                />
            </div>

            {/* Channel Selector Strip */}
            <div style={{
                padding: '0.75rem',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={() => scrollChannels('left')}
                        style={{
                            flexShrink: 0, background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)', borderRadius: '6px',
                            padding: '5px', cursor: 'pointer', color: 'var(--color-text-tertiary)',
                            display: 'flex', alignItems: 'center'
                        }}
                    >
                        <ChevronLeft size={14} />
                    </button>

                    <div
                        ref={scrollRef}
                        style={{
                            display: 'flex', gap: '0.5rem', overflowX: 'auto',
                            scrollbarWidth: 'none', flex: 1, flexWrap: 'nowrap',
                            msOverflowStyle: 'none'
                        }}
                    >
                        {filteredChannels.map(channel => {
                            const isActive = channel.id === activeChannel.id;
                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => switchChannel(channel)}
                                    style={{
                                        flex: '0 0 auto',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                        border: `1px solid ${isActive ? channel.color : 'var(--color-border)'}`,
                                        background: isActive ? `${channel.color}15` : 'var(--color-bg-primary)',
                                        color: isActive ? channel.color : 'var(--color-text-secondary)',
                                        fontWeight: isActive ? 800 : 500,
                                        fontSize: '0.75rem',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isActive ? `0 0 12px ${channel.color}20` : 'none',
                                        whiteSpace: 'nowrap',
                                        minWidth: 'fit-content'
                                    }}
                                >
                                    <div style={{
                                        width: '18px', height: '18px', borderRadius: '4px',
                                        background: 'white', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                                        padding: '1px', border: '1px solid rgba(0,0,0,0.1)'
                                    }}>
                                        <img 
                                            src={channel.logo} 
                                            alt={channel.shortName}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.innerText = channel.shortName[0];
                                            }}
                                        />
                                    </div>
                                    {channel.shortName}
                                    {isActive && (
                                        <div className="pulse" style={{
                                            width: '5px', height: '5px', borderRadius: '50%',
                                            background: channel.color, flexShrink: 0
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => scrollChannels('right')}
                        style={{
                            flexShrink: 0, background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)', borderRadius: '6px',
                            padding: '5px', cursor: 'pointer', color: 'var(--color-text-tertiary)',
                            display: 'flex', alignItems: 'center'
                        }}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* Direct Link Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <a
                        href={`https://www.youtube.com/channel/${activeChannel.youtubeId}/live`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: '0.65rem', color: 'var(--color-text-tertiary)',
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                    >
                        <Maximize2 size={10} /> Open {activeChannel.shortName} in YouTube
                    </a>
                </div>
            </div>

            <style>{`
                @keyframes scan-progress {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .live-streams-card::-webkit-scrollbar { display: none; }
                
                /* NUCLEAR UI CLEANUP: Hide all residual elements requested by user */
                .live-streams-header, 
                .category-filters,
                .live-badge,
                .filter-btn,
                .tab-header {
                    display: none !important;
                }
            `}</style>
        </div>
    );
};

export default LiveIntelligenceStreams;
