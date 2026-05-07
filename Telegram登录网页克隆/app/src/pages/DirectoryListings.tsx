import { useState } from 'react';
import {
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  Star,
  Eye,
  Users,
  MessageCircle,
  Tag,
} from 'lucide-react';

export default function DirectoryListings() {
  const [query, setQuery] = useState('');

  const listings = [
    { id: 1, name: '科技讨论群组', category: '科技', description: '讨论最新科技趋势和产品', members: 1250, rating: 4.8, featured: true },
    { id: 2, name: '投资理财圈', category: '金融', description: '分享投资经验和理财知识', members: 890, rating: 4.5, featured: false },
    { id: 3, name: '游戏玩家联盟', category: '游戏', description: '各类游戏讨论和组队', members: 2100, rating: 4.7, featured: true },
  ];

  return (
    <div className="pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="page-header">目录列表</h2>
          <p className="page-description">
            管理您的群组目录列表，让更多用户发现您的社区。
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            <span>新建列表</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-shadowy-300">显示中</label>
          <select className="form-select">
            <option>10</option>
            <option>25</option>
          </select>
          <span className="text-sm text-shadowy-300">共 {listings.length}</span>
        </div>
        <div className="relative min-w-0 flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shadowy-200" />
          <input
            placeholder="搜索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="form-input pl-10 w-full"
          />
        </div>
      </div>

      <div className="space-y-4">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-dark">{listing.name}</h3>
                {listing.featured && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                    精选
                  </span>
                )}
              </div>
              <p className="text-sm text-shadowy-200 mb-3">{listing.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-shadowy-300">
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {listing.category}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {listing.members} 成员
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {listing.rating}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  活跃
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary">
                <Eye className="w-4 h-4" />
                <span>查看</span>
              </button>
              <button className="p-2 hover:bg-light rounded-lg">
                <Pencil className="w-4 h-4 text-shadowy-300" />
              </button>
              <button className="p-2 hover:bg-light rounded-lg">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
